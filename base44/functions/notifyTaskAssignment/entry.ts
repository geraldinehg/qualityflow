import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { taskId, projectId, assignedTo, taskTitle, projectName } = await req.json();

    // Obtener información del usuario asignado
    const members = await base44.asServiceRole.entities.TeamMember.filter({ user_email: assignedTo });
    const member = members[0];
    
    if (!member) {
      return Response.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Enviar email de notificación
    const emailSubject = `Nueva tarea asignada: ${taskTitle}`;
    const emailBody = `
      <h2>Te han asignado una nueva tarea</h2>
      <p><strong>Proyecto:</strong> ${projectName}</p>
      <p><strong>Tarea:</strong> ${taskTitle}</p>
      <p>Puedes ver los detalles ingresando a la plataforma de gestión de proyectos.</p>
      <br>
      <p style="color: #666;">Para agregar esta tarea a tu calendario de Google, haz clic en el enlace dentro de la notificación en la plataforma.</p>
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'Antpack - Gestión de Proyectos',
      to: assignedTo,
      subject: emailSubject,
      body: emailBody
    });

    // Crear notificación en la base de datos
    await base44.asServiceRole.entities.TaskNotification.create({
      task_id: taskId,
      project_id: projectId,
      recipient_email: assignedTo,
      event_type: 'assigned',
      message: `Te han asignado la tarea "${taskTitle}" en el proyecto ${projectName}`,
      metadata: {
        taskTitle,
        projectName,
        canAddToCalendar: true
      }
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error en notifyTaskAssignment:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});