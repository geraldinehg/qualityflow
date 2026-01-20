import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, Calendar, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function TaskNotificationBadge() {
  const [user, setUser] = React.useState(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    loadUser();
  }, []);

  const { data: notifications = [] } = useQuery({
    queryKey: ['task-notifications', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.TaskNotification.filter({ 
        recipient_email: user.email,
        is_read: false
      });
    },
    enabled: !!user,
    refetchInterval: 30000 // Actualizar cada 30 segundos
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.TaskNotification.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-notifications', user?.email] });
    }
  });

  const addToCalendar = async ({ taskId, projectId, notification }) => {
    try {
      // Obtener información de la tarea
      const tasks = await base44.entities.Task.filter({ id: taskId, project_id: projectId });
      const task = tasks[0];
      
      if (!task) {
        toast.error('Tarea no encontrada');
        return;
      }

      // Obtener proyecto
      const projects = await base44.entities.Project.filter({ id: projectId });
      const project = projects[0];

      // Crear URL de Google Calendar
      const eventDate = task.due_date || new Date().toISOString().split('T')[0];
      const title = encodeURIComponent(task.title);
      const description = encodeURIComponent(`Proyecto: ${project?.name}\n\n${task.description || ''}`);
      const dates = `${eventDate.replace(/-/g, '')}/${eventDate.replace(/-/g, '')}`;

      const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${description}`;

      window.open(calendarUrl, '_blank');
      
      // Marcar notificación como leída
      if (notification) {
        markAsReadMutation.mutate(notification.id);
      }
      
      toast.success('✅ Abriendo Google Calendar');
    } catch (error) {
      toast.error('Error al abrir calendario');
    }
  };

  const unreadCount = notifications.length;

  if (!user) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 bg-white p-0" align="end">
        <div className="p-4 border-b border-[var(--border-primary)]">
          <h3 className="font-semibold text-[var(--text-primary)]">Notificaciones</h3>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-secondary)]">
              No tienes notificaciones nuevas
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-primary)]">
              {notifications.map((notification) => (
                <div key={notification.id} className="p-4 hover:bg-[var(--bg-hover)] transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-[var(--text-primary)] mb-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {format(new Date(notification.created_date), "d 'de' MMMM 'a las' HH:mm", { locale: es })}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {notification.metadata?.canAddToCalendar && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => addToCalendar({
                            taskId: notification.task_id,
                            projectId: notification.project_id,
                            notification
                          })}
                          title="Agregar a Google Calendar"
                        >
                          <Calendar className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => markAsReadMutation.mutate(notification.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}