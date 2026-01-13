import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

/**
 * Hook para gestionar tareas de un proyecto
 * Incluye validaciones de estado y lógica de negocio
 */
export function useProjectTasks(projectId, config) {
  const queryClient = useQueryClient();

  // Cargar tareas
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      return await base44.entities.Task.filter({ project_id: projectId });
    },
    enabled: !!projectId,
    staleTime: 30 * 1000 // 30 segundos
  });

  // Crear tarea
  const createMutation = useMutation({
    mutationFn: async (taskData) => {
      // Validaciones
      if (!taskData.title?.trim()) {
        throw new Error('El título es requerido');
      }
      
      if (!taskData.status) {
        // Usar primer estado si no se especifica
        taskData.status = config?.custom_statuses?.[0]?.key || 'todo';
      }
      
      if (!taskData.priority) {
        // Usar prioridad media por defecto
        const mediumPriority = config?.custom_priorities?.find(p => p.key === 'medium');
        taskData.priority = mediumPriority?.key || config?.custom_priorities?.[0]?.key || 'medium';
      }
      
      return await base44.entities.Task.create({
        ...taskData,
        project_id: projectId,
        order: tasks.length
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast.success('Tarea creada');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  // Actualizar tarea
  const updateMutation = useMutation({
    mutationFn: async ({ taskId, updates }) => {
      // Validar transición de estado si se está cambiando
      if (updates.status && config) {
        const newStatus = config.custom_statuses.find(s => s.key === updates.status);
        
        // Si es estado final, validar campos requeridos
        if (newStatus?.is_final) {
          const task = tasks.find(t => t.id === taskId);
          const requiredFields = config.custom_fields?.filter(f => f.required) || [];
          const missingFields = requiredFields.filter(f => !task?.custom_fields?.[f.key]);
          
          if (missingFields.length > 0) {
            throw new Error(`Completa: ${missingFields.map(f => f.label).join(', ')}`);
          }
        }
      }
      
      return await base44.entities.Task.update(taskId, updates);
    },
    onMutate: async ({ taskId, updates }) => {
      // Actualización optimista
      await queryClient.cancelQueries({ queryKey: ['tasks', projectId] });
      const previousTasks = queryClient.getQueryData(['tasks', projectId]);
      
      queryClient.setQueryData(['tasks', projectId], (old = []) =>
        old.map(t => t.id === taskId ? { ...t, ...updates } : t)
      );
      
      return { previousTasks };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
    onError: (error, variables, context) => {
      // Rollback
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', projectId], context.previousTasks);
      }
      toast.error(`Error: ${error.message}`);
    }
  });

  // Eliminar tarea
  const deleteMutation = useMutation({
    mutationFn: async (taskId) => {
      await base44.entities.Task.delete(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast.success('Tarea eliminada');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  // Reordenar tareas en una columna
  const reorderMutation = useMutation({
    mutationFn: async ({ statusKey, reorderedTasks }) => {
      const updates = reorderedTasks.map((task, index) =>
        base44.entities.Task.update(task.id, { order: index })
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
    onError: (error) => {
      toast.error('Error al reordenar');
    }
  });

  // Utilidades
  const getTasksByStatus = (statusKey) => {
    return tasks
      .filter(t => t.status === statusKey)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  const getStatusLabel = (statusKey) => {
    return config?.custom_statuses?.find(s => s.key === statusKey)?.label || statusKey;
  };

  const getPriorityLabel = (priorityKey) => {
    return config?.custom_priorities?.find(p => p.key === priorityKey)?.label || priorityKey;
  };

  return {
    tasks,
    isLoading,
    createTask: createMutation.mutate,
    updateTask: updateMutation.mutate,
    deleteTask: deleteMutation.mutate,
    reorderTasks: reorderMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    getTasksByStatus,
    getStatusLabel,
    getPriorityLabel
  };
}