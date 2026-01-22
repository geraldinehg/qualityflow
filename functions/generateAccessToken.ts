import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, sharedWithEmail, permissions, expiresAt } = await req.json();

    if (!projectId || !sharedWithEmail || !permissions) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generar token único y seguro
    const tokenArray = new Uint8Array(32);
    crypto.getRandomValues(tokenArray);
    const token = Array.from(tokenArray, byte => byte.toString(16).padStart(2, '0')).join('');

    // Crear registro de acceso compartido
    const sharedAccess = await base44.asServiceRole.entities.SharedProjectAccess.create({
      project_id: projectId,
      shared_by: user.email,
      shared_with_email: sharedWithEmail,
      access_token: token,
      permissions,
      expires_at: expiresAt || null,
      is_active: true
    });

    // Registrar la acción
    await base44.asServiceRole.entities.AccessLog.create({
      project_id: projectId,
      shared_access_id: sharedAccess.id,
      accessed_by: user.email,
      action: 'token_generated',
      section: 'share_access'
    });

    // Enviar email de notificación
    await base44.integrations.Core.SendEmail({
      to: sharedWithEmail,
      subject: `Te han compartido acceso al proyecto`,
      body: `${user.full_name || user.email} te ha compartido acceso a un proyecto.\n\nToken de acceso: ${token}\n\nPuedes ver los accesos compartidos en tu perfil.`
    });

    return Response.json({ 
      success: true, 
      token,
      sharedAccessId: sharedAccess.id 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});