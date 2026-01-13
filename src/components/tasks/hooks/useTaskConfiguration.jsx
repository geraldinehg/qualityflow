import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const DEFAULT_CONFIG = {
  module_enabled: true,
  custom_statuses: [
    { key: 'todo', label: 'Por hacer', color: 'gray', is_final: false, order: 0 },
    { key: 'in_progress', label: 'En progreso', color: 'blue', is_final: false, order: 1 },
    { key: 'completed', label: 'Completado', color: 'green', is_final: true, order: 2 }
  ],
  custom_priorities: [
    { key: 'low', label: 'Baja', color: 'gray', order: 0 },
    { key: 'medium', label: 'Media', color: 'yellow', order: 1 },
    { key: 'high', label: 'Alta', color: 'red', order: 2 }
  ],
  custom_fields: []
};

/**
 * Hook para gestionar la configuración de tareas de un proyecto
 * Garantiza que siempre exista una configuración válida
 */
export function useTaskConfiguration(projectId) {
  const queryClient = useQueryClient();

  // Cargar configuración
  const { data: config, isLoading, error } = useQuery({
    queryKey: ['task-configuration', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('projectId es requerido');

      const configs = await base44.entities.TaskConfiguration.filter({ project_id: projectId });
      
      if (configs && configs.length > 0) {
        return configs[0];
      }
      
      // Crear configuración por defecto si no existe
      const newConfig = await base44.entities.TaskConfiguration.create({
        ...DEFAULT_CONFIG,
        project_id: projectId
      });
      
      return newConfig;
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1
  });

  // Actualizar configuración
  const updateMutation = useMutation({
    mutationFn: async (updates) => {
      if (!config?.id) throw new Error('No hay configuración para actualizar');
      
      // Validaciones
      if (updates.custom_statuses) {
        if (updates.custom_statuses.length === 0) {
          throw new Error('Debe haber al menos un estado');
        }
        const hasFinal = updates.custom_statuses.some(s => s.is_final);
        if (!hasFinal) {
          throw new Error('Debe haber al menos un estado final');
        }
      }
      
      if (updates.custom_priorities && updates.custom_priorities.length === 0) {
        throw new Error('Debe haber al menos una prioridad');
      }
      
      return await base44.entities.TaskConfiguration.update(config.id, updates);
    },
    onSuccess: (updatedConfig) => {
      queryClient.setQueryData(['task-configuration', projectId], updatedConfig);
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast.success('Configuración guardada');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  return {
    config,
    isLoading,
    error,
    updateConfig: updateMutation.mutate,
    isUpdating: updateMutation.isPending
  };
}