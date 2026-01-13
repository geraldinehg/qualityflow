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

    // Validar email del solicitante
    if (!task_data.requester_email) {
      return Response.json({ error: 'Email del solicitante es obligatorio' }, { status: 400 });
    }

    // Crear la tarea
    const taskPayload = {
      project_id: formConfig.project_id,
      title: task_data.title,
      description: task_data.description,
      status: formConfig.default_status || 'todo',
      priority: task_data.priority,
      due_date: task_data.due_date,
      requester_email: task_data.requester_email,
      custom_fields: task_data.custom_fields || {},
      order: 0
    };

    const newTask = await base44.asServiceRole.entities.Task.create(taskPayload);
    console.log('✅ Task created:', newTask.id);

    // Enviar notificación por email si está configurado
    if (formConfig.notification_emails && formConfig.notification_emails.length > 0) {
      console.log('📧 Sending email to:', formConfig.notification_emails);
      try {
        for (const email of formConfig.notification_emails) {
          const emailResult = await base44.asServiceRole.integrations.Core.SendEmail({
            to: email,
            subject: `Nueva tarea: ${task_data.title}`,
            body: `Se ha recibido una nueva tarea a través del formulario "${formConfig.form_title}".

Solicitante: ${task_data.requester_email}
Título: ${task_data.title}
Descripción: ${task_data.description || 'Sin descripción'}
Prioridad: ${task_data.priority || 'Sin prioridad'}

Ver tarea en el sistema.`
          });
          console.log('Email sent result:', emailResult);
        }
        console.log('✅ Email notifications sent');
      } catch (emailError) {
        console.error('❌ Error sending notification email:', emailError.message, emailError.stack);
        // No fallar el request si el email falla
      }
    } else {
      console.log('ℹ️ No notification emails configured');
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