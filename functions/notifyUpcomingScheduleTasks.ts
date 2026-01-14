import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    console.log('Starting schedule task notifications check...');

    // Obtener todas las tareas del cronograma
    const allTasks = await base44.asServiceRole.entities.ScheduleTask.list();
    console.log(`Found ${allTasks.length} total schedule tasks`);

    // Obtener todos los proyectos para acceder a responsables
    const projects = await base44.asServiceRole.entities.Project.list();
    const projectMap = {};
    projects.forEach(p => {
      projectMap[p.id] = p;
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const notifications = [];

    // Agrupar tareas por proyecto
    const tasksByProject = {};
    allTasks.forEach(task => {
      if (!tasksByProject[task.project_id]) {
        tasksByProject[task.project_id] = [];
      }
      tasksByProject[task.project_id].push(task);
    });

    // Por cada proyecto, revisar tareas próximas a finalizar
    for (const [projectId, tasks] of Object.entries(tasksByProject)) {
      const project = projectMap[projectId];
      if (!project) continue;

      // Ordenar tareas por fecha de inicio
      const sortedTasks = tasks.sort((a, b) => 
        new Date(a.start_date) - new Date(b.start_date)
      );

      sortedTasks.forEach((task, index) => {
        const endDate = new Date(task.end_date);
        endDate.setHours(0, 0, 0, 0);
        
        const daysUntilEnd = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

        // Si la tarea finaliza en 2 días o menos y no está completada
        if (daysUntilEnd >= 0 && daysUntilEnd <= 2 && task.status !== 'completed') {
          // Buscar la siguiente tarea del proyecto
          const nextTask = sortedTasks[index + 1];
          
          if (nextTask) {
            const nextArea = nextTask.area;
            const responsible = project.area_responsibles?.[nextArea];

            if (responsible) {
              notifications.push({
                projectName: project.name,
                currentTask: task.name,
                currentArea: task.area,
                nextTask: nextTask.name,
                nextArea: nextArea,
                responsible: responsible,
                daysUntilEnd: daysUntilEnd,
                nextStartDate: nextTask.start_date
              });
            }
          }

          // También notificar al responsable actual
          if (task.assigned_to) {
            notifications.push({
              projectName: project.name,
              currentTask: task.name,
              currentArea: task.area,
              responsible: task.assigned_to,
              daysUntilEnd: daysUntilEnd,
              isCurrentResponsible: true
            });
          }
        }
      });
    }

    console.log(`Generated ${notifications.length} notifications`);

    // Enviar notificaciones por email
    const emailPromises = notifications.map(async (notif) => {
      try {
        const subject = notif.isCurrentResponsible 
          ? `⏰ Tarea próxima a finalizar: ${notif.currentTask}`
          : `🔔 Próxima área del cronograma: ${notif.projectName}`;

        const body = notif.isCurrentResponsible 
          ? `
            <h2>Tarea próxima a finalizar</h2>
            <p><strong>Proyecto:</strong> ${notif.projectName}</p>
            <p><strong>Tarea:</strong> ${notif.currentTask}</p>
            <p><strong>Área:</strong> ${notif.currentArea}</p>
            <p><strong>Finaliza en:</strong> ${notif.daysUntilEnd === 0 ? 'Hoy' : `${notif.daysUntilEnd} día(s)`}</p>
            <p>Por favor, asegúrate de completar esta tarea para no retrasar el cronograma del proyecto.</p>
          `
          : `
            <h2>Próxima área en el cronograma</h2>
            <p><strong>Proyecto:</strong> ${notif.projectName}</p>
            <p><strong>Tarea actual:</strong> ${notif.currentTask} (${notif.currentArea})</p>
            <p><strong>Finaliza en:</strong> ${notif.daysUntilEnd === 0 ? 'Hoy' : `${notif.daysUntilEnd} día(s)`}</p>
            <br>
            <p><strong>Tu tarea siguiente:</strong> ${notif.nextTask}</p>
            <p><strong>Área:</strong> ${notif.nextArea}</p>
            <p><strong>Fecha de inicio:</strong> ${notif.nextStartDate}</p>
            <p>Por favor, prepárate para comenzar tu parte del cronograma.</p>
          `;

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: notif.responsible,
          subject: subject,
          body: body
        });

        return { success: true, email: notif.responsible };
      } catch (error) {
        console.error(`Error sending email to ${notif.responsible}:`, error);
        return { success: false, email: notif.responsible, error: error.message };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`Notifications sent: ${successCount} successful, ${failureCount} failed`);

    return Response.json({
      success: true,
      totalNotifications: notifications.length,
      emailsSent: successCount,
      emailsFailed: failureCount,
      results: results
    });

  } catch (error) {
    console.error('Error in notifyUpcomingScheduleTasks:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});