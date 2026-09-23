import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { token } = await req.json();

    if (!token) {
      return Response.json({ error: 'Token requerido' }, { status: 400 });
    }

    // Buscar token
    const tokens = await base44.asServiceRole.entities.ProjectAccessToken.filter({ token });
    
    if (tokens.length === 0) {
      return Response.json({ error: 'Token inválido' }, { status: 404 });
    }

    const accessToken = tokens[0];

    // Validar si está revocado
    if (accessToken.is_revoked) {
      return Response.json({ error: 'Token revocado' }, { status: 403 });
    }

    // Validar expiración
    if (accessToken.expires_at && new Date(accessToken.expires_at) < new Date()) {
      return Response.json({ error: 'Token expirado' }, { status: 403 });
    }

    // Actualizar última vez accedido y contador
    await base44.asServiceRole.entities.ProjectAccessToken.update(accessToken.id, {
      last_accessed_at: new Date().toISOString(),
      access_count: (accessToken.access_count || 0) + 1
    });

    // Si el token es para un ítem específico (nuevo sistema)
    if (accessToken.access_item_id || (accessToken.access_item_ids && accessToken.access_item_ids.length > 0)) {
      // Obtener info del proyecto
      const projects = await base44.asServiceRole.entities.Project.filter({ id: accessToken.project_id });
      
      // Registrar acceso en log
      await base44.asServiceRole.entities.ProjectAccessLog.create({
        token_id: accessToken.id,
        project_id: accessToken.project_id,
        action: 'view',
        section: 'access_items',
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      });
      
      return Response.json({ 
        success: true, 
        token: accessToken,
        access: {
          project_name: projects[0]?.name,
          recipient_name: accessToken.recipient_name
        }
      });
    }

    // Sistema legacy (accesos antiguos)
    const projectAccess = await base44.asServiceRole.entities.ProjectAccess.filter({ 
      project_id: accessToken.project_id 
    });

    if (projectAccess.length === 0) {
      return Response.json({ error: 'Accesos no encontrados' }, { status: 404 });
    }

    const access = projectAccess[0];
    const permissions = accessToken.permissions;

    // Filtrar solo los accesos permitidos
    const sharedAccess = {
      project_id: accessToken.project_id,
      recipient_name: accessToken.recipient_name,
      data: {}
    };

    if (permissions.qa_hosting) {
      sharedAccess.data.qa_hosting = {
        url: access.qa_hosting_url,
        user: access.qa_hosting_user,
        password: access.qa_hosting_password
      };
    }

    if (permissions.prod_hosting) {
      sharedAccess.data.prod_hosting = {
        url: access.prod_hosting_url,
        user: access.prod_hosting_user,
        password: access.prod_hosting_password
      };
    }

    if (permissions.cms_qa) {
      sharedAccess.data.cms_qa = {
        url: access.cms_qa_url,
        user: access.cms_qa_user,
        password: access.cms_qa_password
      };
    }

    if (permissions.cms_prod) {
      sharedAccess.data.cms_prod = {
        url: access.cms_prod_url,
        user: access.cms_prod_user,
        password: access.cms_prod_password
      };
    }

    if (permissions.apis && permissions.apis.length > 0 && access.apis) {
      sharedAccess.data.apis = permissions.apis.map(index => access.apis[index]).filter(Boolean);
    }

    // Registrar en log
    await base44.asServiceRole.entities.ProjectAccessLog.create({
      token_id: accessToken.id,
      project_id: accessToken.project_id,
      action: 'view',
      section: 'general',
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown'
    });

    // Obtener info del proyecto
    const projects = await base44.asServiceRole.entities.Project.filter({ id: accessToken.project_id });
    if (projects.length > 0) {
      sharedAccess.project_name = projects[0].name;
    }

    return Response.json({ success: true, access: sharedAccess });

  } catch (error) {
    console.error('Error validating token:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});