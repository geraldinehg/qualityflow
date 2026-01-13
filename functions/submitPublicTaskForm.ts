import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { form_token, task_data } = await req.json();

    if (!form_token || !task_data) {
      return Response.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    // Buscar configuración del formulario
    const forms = await base44.asServiceRole.entities.TaskFormPublicUrl.filter({
      form_token,
      is_active: true
    });

    if (!forms || forms.length === 0) {
      return Response.json({ error: 'Formulario no encontrado o inactivo' }, { status: 404 });
    }

    const formConfig = forms[0];

    // Validar límite de envíos (anti-spam)
    if (formConfig.max_submissions_per_day) {
      const today = new Date().toISOString().split('T')[0];
      const todayTasks = await base44.asServiceRole.entities.Task.filter({
        project_id: formConfig.project_id,
        created_date: { $gte: `${today}T00:00:00Z` }
      });

      if (todayTasks.length >= formConfig.max_submissions_per_day) {
        return Response.json(
          { error: 'Se ha alcanzado el límite de envíos diarios' },
          { status: 429 }
        );
      }
    }

    // Crear la tarea
    const taskPayload = {
      project_id: formConfig.project_id,
      title: task_data.title,
      description: task_data.description,
      status: formConfig.default_status || 'todo',
      priority: task_data.priority,
      due_date: task_data.due_date,
      custom_fields: task_data.custom_fields || {},
      order: 0
    };

    const newTask = await base44.asServiceRole.entities.Task.create(taskPayload);

    // Enviar notificación por email si está configurado
    if (formConfig.notification_emails && formConfig.notification_emails.length > 0) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: formConfig.notification_emails.join(','),
          subject: `Nueva tarea: ${task_data.title}`,
          body: `
            Se ha recibido una nueva tarea a través del formulario "${formConfig.form_title}".
            
            Título: ${task_data.title}
            Descripción: ${task_data.description || 'Sin descripción'}
            Prioridad: ${task_data.priority || 'Sin prioridad'}
            
            Ver en el sistema: ${Deno.env.get('APP_URL') || 'https://app.base44.com'}
          `
        });
      } catch (emailError) {
        console.error('Error sending notification email:', emailError);
        // No fallar el request si el email falla
      }
    }

    // Disparar reglas de notificación para task_created
    try {
      const notificationRules = await base44.asServiceRole.entities.TaskNotificationRule.filter({
        project_id: formConfig.project_id,
        is_active: true,
        trigger_event: 'task_created'
      });

      for (const rule of notificationRules) {
        if (rule.action?.send_email && rule.action?.email_recipients?.length > 0) {
          const emailBody = (rule.action.email_body || '')
            .replace(/{{task\.title}}/g, task_data.title)
            .replace(/{{task\.status}}/g, formConfig.default_status)
            .replace(/{{task\.priority}}/g, task_data.priority || 'sin prioridad');

          await base44.asServiceRole.integrations.Core.SendEmail({
            to: rule.action.email_recipients.join(','),
            subject: rule.action.email_subject || 'Nueva tarea creada',
            body: emailBody
          });
        }
      }
    } catch (notifError) {
      console.error('Error triggering notification rules:', notifError);
    }

    return Response.json({
      success: true,
      task_id: newTask.id,
      message: formConfig.success_message || 'Tarea creada correctamente'
    });

  } catch (error) {
    console.error('Error in submitPublicTaskForm:', error);
    return Response.json(
      { error: 'Error al procesar el formulario', details: error.message },
      { status: 500 }
    );
  }
});