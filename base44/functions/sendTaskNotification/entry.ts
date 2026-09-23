import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar autenticación
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { 
      taskId, 
      projectId, 
      notificationType, // 'task_created', 'task_assigned', 'task_completed'
      recipientEmail,
      recipientName,
      taskTitle,
      taskDescription,
      projectName,
      assignedToName,
      completedByName,
      dueDate // fecha de vencimiento para calendario
    } = await req.json();

    if (!taskId || !projectId || !notificationType || !recipientEmail) {
      return Response.json({ 
        error: 'Faltan parámetros requeridos' 
      }, { status: 400 });
    }

    // Construir el contenido del email según el tipo
    let subject = '';
    let body = '';

    const baseUrl = req.headers.get('origin') || 'https://tu-app.base44.app';
    const projectUrl = `${baseUrl}/projects/${projectId}`;
    
    // Generar enlace de Google Calendar si hay fecha de vencimiento
    let calendarLink = '';
    if (dueDate) {
      const startDate = new Date(dueDate);
      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + 1); // 1 hora de duración por defecto
      
      const formatDateForGCal = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };
      
      const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: taskTitle,
        details: `${taskDescription || ''}\n\nProyecto: ${projectName}\n\nVer detalles: ${projectUrl}`,
        dates: `${formatDateForGCal(startDate)}/${formatDateForGCal(endDate)}`,
        location: projectName
      });
      
      calendarLink = `https://calendar.google.com/calendar/render?${params.toString()}`;
    }

    switch (notificationType) {
      case 'task_created':
        subject = `Nueva tarea asignada: ${taskTitle}`;
        body = `
Hola ${recipientName || recipientEmail.split('@')[0]},

Se te ha asignado una nueva tarea en el proyecto "${projectName}":

📋 Tarea: ${taskTitle}
${taskDescription ? `📝 Descripción: ${taskDescription}` : ''}
📁 Proyecto: ${projectName}
${dueDate ? `📅 Fecha de vencimiento: ${new Date(dueDate).toLocaleDateString('es', { dateStyle: 'long' })}` : ''}

Puedes ver los detalles completos en: ${projectUrl}

${calendarLink ? `\n📆 Agregar a Google Calendar:\n${calendarLink}\n` : ''}
---
Este es un correo automático del sistema de gestión de proyectos.
        `.trim();
        break;

      case 'task_assigned':
        subject = `Te han asignado una tarea: ${taskTitle}`;
        body = `
Hola ${recipientName || recipientEmail.split('@')[0]},

${user.full_name || user.email} te ha asignado una tarea:

📋 Tarea: ${taskTitle}
${taskDescription ? `📝 Descripción: ${taskDescription}` : ''}
📁 Proyecto: ${projectName}
${dueDate ? `📅 Fecha de vencimiento: ${new Date(dueDate).toLocaleDateString('es', { dateStyle: 'long' })}` : ''}

Puedes ver los detalles completos en: ${projectUrl}

${calendarLink ? `\n📆 Agregar a Google Calendar:\n${calendarLink}\n` : ''}
---
Este es un correo automático del sistema de gestión de proyectos.
        `.trim();
        break;

      case 'task_completed':
        subject = `Tarea completada: ${taskTitle}`;
        body = `
Hola ${recipientName || recipientEmail.split('@')[0]},

Tu solicitud "${taskTitle}" ha sido completada.

📋 Tarea: ${taskTitle}
${taskDescription ? `📝 Descripción: ${taskDescription}` : ''}
📁 Proyecto: ${projectName}
✅ Completada por: ${completedByName || user.full_name || user.email}
🕐 Fecha: ${new Date().toLocaleString('es', { 
  dateStyle: 'long', 
  timeStyle: 'short' 
})}

Puedes ver los detalles completos en: ${projectUrl}

---
Este es un correo automático del sistema de gestión de proyectos.
        `.trim();
        break;

      default:
        return Response.json({ 
          error: 'Tipo de notificación no válido' 
        }, { status: 400 });
    }

    // Enviar el email
    let emailSuccess = false;
    let emailError = null;

    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: recipientEmail,
        subject: subject,
        body: body
      });
      emailSuccess = true;
    } catch (error) {
      console.error('Error enviando email:', error);
      emailError = error.message;
      // No lanzar error, registrar y continuar
    }

    // Registrar en el log de actividad
    try {
      await base44.asServiceRole.entities.TaskActivityLog.create({
        task_id: taskId,
        project_id: projectId,
        action_type: 'notification_sent',
        action_by: user.email,
        action_by_name: user.full_name,
        notification_details: {
          recipient: recipientEmail,
          subject: subject,
          success: emailSuccess,
          error: emailError
        },
        metadata: {
          notification_type: notificationType,
          sent_at: new Date().toISOString()
        }
      });
    } catch (logError) {
      console.error('Error registrando en log:', logError);
      // No bloquear el flujo si falla el log
    }

    return Response.json({
      success: emailSuccess,
      message: emailSuccess 
        ? 'Notificación enviada correctamente' 
        : 'No se pudo enviar el email',
      error: emailError,
      log_created: true
    });

  } catch (error) {
    console.error('Error en sendTaskNotification:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});