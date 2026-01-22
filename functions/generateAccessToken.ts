import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, sharedWithEmail, permissions, expiresAt } = await req.json();

    console.log('Sharing access:', { projectId, sharedWithEmail, permissions, expiresAt });

    if (!projectId || !sharedWithEmail || !permissions) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generar token único y seguro
    const tokenArray = new Uint8Array(32);
    crypto.getRandomValues(tokenArray);
    const token = Array.from(tokenArray, byte => byte.toString(16).padStart(2, '0')).join('');

    console.log('Generated token:', token);

    // Crear registro de acceso compartido
    const sharedAccess = await base44.asServiceRole.entities.SharedProjectAccess.create({
      project_id: projectId,
      shared_by: user.email,
      shared_with_email: sharedWithEmail,
      access_token: token,
      permissions: permissions,
      expires_at: expiresAt || null,
      is_active: true
    });

    console.log('Created shared access:', sharedAccess.id);

    // Registrar la acción
    try {
      await base44.asServiceRole.entities.AccessLog.create({
        project_id: projectId,
        shared_access_id: sharedAccess.id,
        accessed_by: user.email,
        action: 'token_generated',
        section: 'share_access'
      });
      console.log('Access log created');
    } catch (logError) {
      console.error('Error creating access log:', logError);
    }

    // Obtener nombre del proyecto
    let projectName = 'el proyecto';
    try {
      const projects = await base44.asServiceRole.entities.Project.filter({ id: projectId });
      if (projects.length > 0) {
        projectName = projects[0].name;
      }
    } catch (projError) {
      console.error('Error getting project name:', projError);
    }

    // Enviar email de notificación
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: sharedWithEmail,
        subject: `Te han compartido acceso al proyecto "${projectName}"`,
        body: `Hola,

${user.full_name || user.email} te ha compartido acceso al proyecto "${projectName}".

Para ver los accesos compartidos, ingresa a la aplicación y ve a la sección de "Accesos Compartidos Conmigo".

${expiresAt ? `Este acceso expira el: ${new Date(expiresAt).toLocaleDateString()}` : 'Este acceso no tiene fecha de expiración.'}

Saludos,
Sistema de Gestión de Proyectos`
      });
      console.log('Email sent successfully');
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // No fallar si el email falla
    }

    return Response.json({ 
      success: true, 
      token,
      sharedAccessId: sharedAccess.id 
    });

  } catch (error) {
    console.error('Error in generateAccessToken:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});