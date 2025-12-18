import { base44 } from '@/api/base44Client';

export const NotificationService = {
  // Notificar cambio de estado en checklist
  async notifyChecklistUpdate(project, item, oldStatus, newStatus, completedBy) {
    if (!project.team_members || project.team_members.length === 0) return;
    
    const notifications = [];
    
    // Notificar al líder web
    if (project.leader_email) {
      notifications.push({
        user_email: project.leader_email,
        type: 'checklist_update',
        title: 'Ítem del checklist actualizado',
        message: `"${item.title}" cambió de "${oldStatus}" a "${newStatus}"`,
        project_id: project.id,
        project_name: project.name,
        priority: item.weight === 'critical' ? 'high' : 'medium',
        link: `/ProjectChecklist?id=${project.id}`
      });
    }
    
    // Notificar al equipo si es un ítem crítico
    if (item.weight === 'critical' || item.weight === 'high') {
      project.team_members.forEach(email => {
        if (email !== completedBy && email !== project.leader_email) {
          notifications.push({
            user_email: email,
            type: 'checklist_update',
            title: 'Ítem importante actualizado',
            message: `"${item.title}" fue completado en ${project.name}`,
            project_id: project.id,
            project_name: project.name,
            priority: 'medium',
            link: `/ProjectChecklist?id=${project.id}`
          });
        }
      });
    }
    
    if (notifications.length > 0) {
      await base44.entities.Notification.bulkCreate(notifications);
    }
  },

  // Notificar nuevo conflicto
  async notifyConflict(project, conflict, checklistItem) {
    const notifications = [];
    
    // Notificar al líder web (urgente)
    if (project.leader_email) {
      notifications.push({
        user_email: project.leader_email,
        type: 'conflict',
        title: '⚠️ Nuevo conflicto detectado',
        message: `Conflicto en "${checklistItem.title}" reportado por ${conflict.reported_by}`,
        project_id: project.id,
        project_name: project.name,
        priority: 'urgent',
        link: `/ProjectChecklist?id=${project.id}`
      });
    }
    
    // Notificar al equipo
    if (project.team_members) {
      project.team_members.forEach(email => {
        if (email !== conflict.reported_by && email !== project.leader_email) {
          notifications.push({
            user_email: email,
            type: 'conflict',
            title: 'Conflicto en el proyecto',
            message: `Se detectó un conflicto en ${project.name}`,
            project_id: project.id,
            project_name: project.name,
            priority: 'high',
            link: `/ProjectChecklist?id=${project.id}`
          });
        }
      });
    }
    
    if (notifications.length > 0) {
      await base44.entities.Notification.bulkCreate(notifications);
    }
  },

  // Notificar conflicto resuelto
  async notifyConflictResolved(project, conflict, resolution) {
    if (!conflict.reported_by) return;
    
    await base44.entities.Notification.create({
      user_email: conflict.reported_by,
      type: 'conflict',
      title: '✅ Conflicto resuelto',
      message: `Tu conflicto en ${project.name} fue resuelto: "${resolution}"`,
      project_id: project.id,
      project_name: project.name,
      priority: 'medium',
      link: `/ProjectChecklist?id=${project.id}`
    });
  },

  // Notificar fecha de entrega próxima
  async notifyDeadlineApproaching(project, daysRemaining) {
    if (!project.team_members || project.team_members.length === 0) return;
    
    const notifications = project.team_members.map(email => ({
      user_email: email,
      type: 'deadline',
      title: `⏰ Entrega en ${daysRemaining} día(s)`,
      message: `El proyecto "${project.name}" debe entregarse pronto`,
      project_id: project.id,
      project_name: project.name,
      priority: daysRemaining <= 2 ? 'urgent' : 'high',
      link: `/ProjectChecklist?id=${project.id}`
    }));
    
    await base44.entities.Notification.bulkCreate(notifications);
  },

  // Notificar fecha vencida
  async notifyDeadlineOverdue(project) {
    if (!project.team_members || project.team_members.length === 0) return;
    
    const notifications = project.team_members.map(email => ({
      user_email: email,
      type: 'deadline',
      title: '🚨 Fecha de entrega vencida',
      message: `El proyecto "${project.name}" tiene la fecha de entrega vencida`,
      project_id: project.id,
      project_name: project.name,
      priority: 'urgent',
      link: `/ProjectChecklist?id=${project.id}`
    }));
    
    await base44.entities.Notification.bulkCreate(notifications);
  },

  // Notificar tarea asignada al rol
  async notifyTaskAssigned(project, item, userRole, teamMembers) {
    if (!teamMembers || teamMembers.length === 0) return;
    
    const notifications = teamMembers.map(email => ({
      user_email: email,
      type: 'task_assigned',
      title: 'Nueva tarea disponible',
      message: `Tarea "${item.title}" lista para tu rol en ${project.name}`,
      project_id: project.id,
      project_name: project.name,
      priority: item.weight === 'critical' ? 'high' : 'medium',
      link: `/ProjectChecklist?id=${project.id}`
    }));
    
    await base44.entities.Notification.bulkCreate(notifications);
  }
};