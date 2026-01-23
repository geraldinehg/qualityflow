import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, GripVertical, Search, Filter, X, CheckCircle2, Loader2, Settings, User } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import TaskFormModal from './TaskFormModal';
import TaskDetailPanel from './TaskDetailPanel';
import TaskConfigurationPanel from './TaskConfigurationPanel';

const COLOR_MAP = {
  gray: 'bg-gray-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
  orange: 'bg-orange-500'
};

export default function TaskKanbanView({ projectId }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [creatingInStatus, setCreatingInStatus] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCustomField, setFilterCustomField] = useState({});
  const [savingTaskId, setSavingTaskId] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const queryClient = useQueryClient();

  // Cargar miembros del equipo
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => base44.entities.TeamMember.filter({ is_active: true })
  });
  
  // Verificar si el usuario es administrador
  React.useEffect(() => {
    const checkAdmin = async () => {
      try {
        const user = await base44.auth.me();
        const members = await base44.entities.TeamMember.filter({ user_email: user.email });
        const member = members[0];
        // Permitir acceso a configuración si es admin de sistema o miembro del equipo
        setIsAdmin(user.role === 'admin' || !!member);
        console.log('👤 Usuario:', user.email, '- Admin:', user.role === 'admin' || !!member);
      } catch (error) {
        console.error('Error checking admin:', error);
      }
    };
    checkAdmin();
  }, []);

  // ==================== BACKEND: Fuente única de verdad ====================
  const { data: config, isLoading: configLoading, refetch: refetchConfig } = useQuery({
    queryKey: ['task-configuration', projectId],
    queryFn: async () => {
      console.log('🔍 [BACKEND] Cargando configuración para proyecto:', projectId);
      
      const projectConfigs = await base44.entities.TaskConfiguration.filter({ project_id: projectId });
      if (projectConfigs && projectConfigs.length > 0) {
        console.log('✅ [BACKEND] Config específica encontrada:', projectConfigs[0]);
        return projectConfigs[0];
      }
      
      // Si no hay configuración del proyecto, crear una automáticamente
      console.log('⚙️ [BACKEND] No hay configuración, creando automáticamente...');
      const newConfig = await base44.entities.TaskConfiguration.create({
        project_id: projectId,
        module_enabled: true,
        custom_statuses: [
          { key: 'todo', label: 'Por hacer', color: 'gray', is_final: false, order: 0 },
          { key: 'in_progress', label: 'En progreso', color: 'blue', is_final: false, order: 1 },
          { key: 'completed', label: 'Finalizado', color: 'green', is_final: true, order: 2 }
        ],
        custom_priorities: [
          { key: 'low', label: 'Baja', color: 'gray', order: 0 },
          { key: 'medium', label: 'Media', color: 'yellow', order: 1 },
          { key: 'high', label: 'Alta', color: 'red', order: 2 }
        ],
        custom_fields: []
      });
      console.log('✅ [BACKEND] Config creada automáticamente:', newConfig);
      toast.success('✅ Configuración de tareas creada');
      return newConfig;
    },
    enabled: !!projectId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true
  });
  
  // Recargar config cuando se cierra el panel de configuración
  React.useEffect(() => {
    if (!showConfig) {
      refetchConfig();
    }
  }, [showConfig, refetchConfig]);

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      console.log('🔍 [BACKEND] Cargando tareas para proyecto:', projectId);
      const result = await base44.entities.Task.filter({ project_id: projectId });
      console.log('✅ [BACKEND] Tareas cargadas:', result.length);
      return result;
    },
    enabled: !!projectId,
    staleTime: 0
  });

  // ==================== MUTATIONS: Con feedback visual robusto ====================
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      console.log('💾 [BACKEND] Actualizando tarea:', id, data);
      const result = await base44.entities.Task.update(id, data);
      console.log('✅ [BACKEND] Tarea actualizada:', result);
      return result;
    },
    onMutate: async ({ id, data }) => {
      // Estado optimista
      console.log('🔄 [FRONTEND] Estado optimista activado para:', id);
      setSavingTaskId(id);
      
      // Cancelar queries en vuelo
      await queryClient.cancelQueries({ queryKey: ['tasks', projectId] });
      
      // Snapshot del estado anterior
      const previousTasks = queryClient.getQueryData(['tasks', projectId]);
      
      // Actualización optimista
      queryClient.setQueryData(['tasks', projectId], (old = []) => 
        old.map(t => t.id === id ? { ...t, ...data } : t)
      );
      
      return { previousTasks };
    },
    onSuccess: (result, { id }) => {
      console.log('✅ [FRONTEND] Confirmación de guardado:', id);
      setSavingTaskId(null);
      
      // Invalidar para forzar recarga y sincronización
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      
      toast.success('✅ Guardado', { duration: 1500 });
    },
    onError: (error, { id }, context) => {
      console.error('❌ [FRONTEND] Error al guardar:', error);
      setSavingTaskId(null);
      
      // Rollback: Restaurar estado anterior
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', projectId], context.previousTasks);
      }
      
      toast.error(`❌ Error: ${error.message}`, { duration: 3000 });
    }
  });

  // ==================== DRAG & DROP: Con validación y reconciliación ====================
  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    const task = tasks.find((t) => t.id === draggableId);
    if (!task) return;

    // Validar campos requeridos antes de mover a estado final
    const destinationStatus = config?.custom_statuses?.find(s => s.key === destination.droppableId);
    if (destinationStatus?.is_final) {
      const requiredFields = config?.custom_fields?.filter(f => f.required) || [];
      const missingFields = requiredFields.filter(f => !task.custom_fields?.[f.key]);
      
      if (missingFields.length > 0) {
        toast.error(`⚠️ Completa: ${missingFields.map(f => f.label).join(', ')}`);
        return;
      }
    }

    // Cambio de columna (estado)
    if (source.droppableId !== destination.droppableId) {
      const toastId = toast.loading('💾 Moviendo tarea...');
      
      try {
        const currentUser = await base44.auth.me();
        const updateData = { status: destination.droppableId };
        
        // Si se mueve a estado final, agregar metadata
        if (destinationStatus?.is_final) {
          updateData.completed_by = currentUser.email;
          updateData.completed_at = new Date().toISOString();
        }
        
        await updateMutation.mutateAsync({
          id: task.id,
          data: updateData
        });
        
        // Log de actividad
        await base44.entities.TaskActivityLog.create({
          task_id: task.id,
          project_id: projectId,
          action_type: destinationStatus?.is_final ? 'completed' : 'status_changed',
          action_by: currentUser.email,
          action_by_name: currentUser.full_name,
          previous_value: { status: source.droppableId },
          new_value: { status: destination.droppableId }
        });
        
        toast.success(`✅ Movida a ${destinationStatus?.label}`, { id: toastId, duration: 2000 });
        
        // Enviar notificación si se completó y tiene email de notificación
        if (destinationStatus?.is_final && task.notification_email) {
          try {
            const project = await base44.entities.Project.filter({ id: projectId });
            await base44.functions.invoke('sendTaskNotification', {
              taskId: task.id,
              projectId: projectId,
              notificationType: 'task_completed',
              recipientEmail: task.notification_email,
              recipientName: task.requester_name,
              taskTitle: task.title,
              taskDescription: task.description,
              projectName: project[0]?.name,
              completedByName: currentUser.full_name
            });
            toast.success('✉️ Notificación enviada', { duration: 2000 });
          } catch (error) {
            console.error('Error enviando notificación:', error);
          }
        }
      } catch (error) {
        toast.error('❌ Error al mover', { id: toastId });
      }
    }

    // Reordenar dentro de la misma columna
    if (source.droppableId === destination.droppableId && source.index !== destination.index) {
      const columnTasks = filteredTasks
        .filter(t => t.status === source.droppableId)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      
      const [movedTask] = columnTasks.splice(source.index, 1);
      columnTasks.splice(destination.index, 0, movedTask);

      // Actualizar orden de todas las tareas afectadas
      const toastId = toast.loading('💾 Reordenando...');
      
      try {
        const updates = columnTasks.map((t, index) => 
          updateMutation.mutateAsync({ id: t.id, data: { order: index } })
        );
        
        await Promise.all(updates);
        toast.success('✅ Orden actualizado', { id: toastId, duration: 1500 });
      } catch (error) {
        toast.error('❌ Error al reordenar', { id: toastId });
      }
    }
  };

  const triggerTaskNotifications = async (task, newStatus) => {
    try {
      const rules = await base44.entities.TaskNotificationRule.filter({
        project_id: projectId,
        is_active: true
      });

      const statusChangedRules = rules.filter(r => 
        r.trigger_event === 'status_changed' && 
        (!r.conditions?.status || r.conditions.status === newStatus)
      );

      for (const rule of statusChangedRules) {
        if (rule.action?.send_email && rule.action?.email_recipients?.length > 0) {
          const emailBody = rule.action.email_body
            .replace(/{{task\.title}}/g, task.title)
            .replace(/{{task\.status}}/g, newStatus)
            .replace(/{{task\.priority}}/g, task.priority || 'sin prioridad');

          await base44.integrations.Core.SendEmail({
            to: rule.action.email_recipients.join(','),
            subject: rule.action.email_subject,
            body: emailBody
          });
        }
      }
    } catch (error) {
      console.error('Error triggering notifications:', error);
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterPriority('all');
    setFilterCustomField({});
  };

  // ==================== FILTRADO ====================
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title?.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query)
      );
    }

    if (filterPriority !== 'all') {
      filtered = filtered.filter((t) => t.priority === filterPriority);
    }

    Object.keys(filterCustomField).forEach((fieldKey) => {
      const fieldValue = filterCustomField[fieldKey];
      if (fieldValue && fieldValue !== 'all') {
        filtered = filtered.filter((t) => t.custom_fields?.[fieldKey] === fieldValue);
      }
    });

    return filtered;
  }, [tasks, searchQuery, filterPriority, filterCustomField]);

  // ==================== LOADING STATES ====================
  if (configLoading || tasksLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF1B7E] mx-auto" />
        <p className="text-sm text-[var(--text-secondary)] mt-4">Cargando Kanban...</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-[var(--text-secondary)]">No hay configuración de tareas para este proyecto</p>
        <p className="text-xs text-[var(--text-tertiary)]">Ve a la pestaña "Config Tareas" para crear la configuración</p>
      </div>
    );
  }

  if (config.module_enabled === false) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--text-secondary)]">El módulo de tareas está deshabilitado</p>
      </div>
    );
  }

  const statuses = (config.custom_statuses || []).sort((a, b) => a.order - b.order);
  
  if (statuses.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-[var(--text-secondary)]">No hay estados configurados</p>
        <p className="text-xs text-[var(--text-tertiary)] mb-4">Necesitas configurar al menos un estado para usar el Kanban</p>
        {isAdmin && (
          <Button
            onClick={() => setShowConfig(true)}
            className="bg-[#FF1B7E] hover:bg-[#e6156e] text-white"
          >
            <Settings className="h-4 w-4 mr-2" />
            Abrir Configuración
          </Button>
        )}
        {!isAdmin && (
          <p className="text-xs text-[var(--text-tertiary)]">Contacta a un administrador para configurar los estados</p>
        )}
      </div>
    );
  }
  
  const priorities = (config.custom_priorities || []).reduce((acc, p) => {
    acc[p.key] = { label: p.label, color: COLOR_MAP[p.color] || 'bg-gray-500' };
    return acc;
  }, {});

  const hasActiveFilters = searchQuery || filterPriority !== 'all' || Object.keys(filterCustomField).length > 0;

  // ==================== RENDER ====================
  
  // Si está en modo configuración, mostrar panel de configuración
  if (showConfig) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Configuración de Tareas</h2>
          <Button
            onClick={() => setShowConfig(false)}
            variant="outline"
            className="bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-primary)]"
          >
            <X className="h-4 w-4 mr-2" />
            Cerrar
          </Button>
        </div>
        <TaskConfigurationPanel projectId={projectId} />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Barra de búsqueda y filtros */}
      <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
        <CardContent className="pt-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
                <Input
                  placeholder="Buscar tareas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[var(--bg-input)]"
                />
              </div>
              
              {isAdmin && (
                <Button
                  onClick={() => setShowConfig(true)}
                  variant="outline"
                  className="bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex-shrink-0"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-40">
                  <Filter className="h-3 w-3 mr-2" />
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">Todas las prioridades</SelectItem>
                  {(config.custom_priorities || []).map((p) => (
                    <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(config.custom_fields || [])
                .filter(f => f.type === 'select')
                .map(field => (
                  <Select
                    key={field.key}
                    value={filterCustomField[field.key] || 'all'}
                    onValueChange={(value) => 
                      setFilterCustomField({ ...filterCustomField, [field.key]: value })
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder={field.label} />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="all">Todos</SelectItem>
                      {(field.options || []).map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ))}

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-3 w-3 mr-1" />
                  Limpiar filtros
                </Button>
              )}

              <div className="ml-auto text-xs text-[var(--text-secondary)] flex items-center">
                {filteredTasks.length} {filteredTasks.length === 1 ? 'tarea' : 'tareas'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tablero Kanban */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div 
          className="grid gap-4 overflow-x-auto pb-4" 
          style={{ gridTemplateColumns: `repeat(${statuses.length}, minmax(320px, 1fr))` }}
        >
          {statuses.map((status) => {
            const statusTasks = filteredTasks
              .filter(t => t.status === status.key)
              .sort((a, b) => (a.order || 0) - (b.order || 0));
            const statusColor = COLOR_MAP[status.color] || 'bg-gray-500';

            return (
              <div key={status.key} className="flex flex-col min-w-[320px]">
                {/* Header de columna */}
                <div className="flex items-center justify-between mb-3 px-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${statusColor}`} />
                    <h3 className="font-semibold text-[var(--text-primary)]">{status.label}</h3>
                    <Badge variant="outline" className="text-xs">{statusTasks.length}</Badge>
                    {status.is_final && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setCreatingInStatus(status.key)}
                    className="h-7 w-7 p-0 hover:bg-[#FF1B7E] hover:text-white transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Drop zone */}
                <Droppable droppableId={status.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 space-y-3 p-3 rounded-xl min-h-[400px] transition-all ${
                        snapshot.isDraggingOver 
                          ? 'bg-[#FF1B7E]/5 border-2 border-[#FF1B7E] border-dashed' 
                          : 'bg-[var(--bg-tertiary)] border-2 border-transparent'
                      }`}
                    >
                      <AnimatePresence>
                        {statusTasks.map((task, index) => {
                          const priority = priorities[task.priority];
                          const isSaving = savingTaskId === task.id;
                          
                          return (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <motion.div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <Card 
                                    className={`cursor-pointer transition-all hover:shadow-md group relative ${
                                      snapshot.isDragging 
                                        ? 'shadow-2xl ring-2 ring-[#FF1B7E] rotate-2' 
                                        : 'shadow-sm'
                                    } ${isSaving ? 'opacity-70' : ''} bg-white border-[var(--border-primary)]`}
                                    onClick={() => handleTaskClick(task)}
                                  >
                                    {isSaving && (
                                      <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md">
                                        <Loader2 className="h-3 w-3 animate-spin text-[#FF1B7E]" />
                                      </div>
                                    )}
                                    <CardContent className="pt-4 pb-3">
                                      <div className="flex items-start gap-3">
                                        <div 
                                          {...provided.dragHandleProps} 
                                          className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <GripVertical className="h-4 w-4 text-[var(--text-tertiary)]" />
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-2">
                                          <h4 className="font-medium text-sm text-[var(--text-primary)] leading-snug">
                                            {task.title}
                                          </h4>
                                          {task.description && (
                                            <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                                              {task.description}
                                            </p>
                                          )}
                                          <div className="flex items-center gap-2 flex-wrap">
                                            {priority && (
                                              <Badge className={`${priority.color} text-white border-0 text-xs`}>
                                                {priority.label}
                                              </Badge>
                                            )}
                                            {task.due_date && (
                                              <Badge variant="outline" className="text-xs">
                                                {new Date(task.due_date).toLocaleDateString('es', { 
                                                  day: 'numeric', 
                                                  month: 'short' 
                                                })}
                                              </Badge>
                                            )}
                                            {(task.assigned_to || []).length > 0 && (
                                              <Badge variant="outline" className="text-xs flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {teamMembers.find(m => m.user_email === task.assigned_to[0])?.display_name?.split(' ')[0] || task.assigned_to[0].split('@')[0]}
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              )}
                            </Draggable>
                          );
                        })}
                      </AnimatePresence>
                      {provided.placeholder}
                      
                      {statusTasks.length === 0 && !snapshot.isDraggingOver && (
                        <div className="text-center py-8 text-sm text-[var(--text-tertiary)]">
                          Sin tareas
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Modal de creación */}
      {creatingInStatus && (
        <TaskFormModal
          isOpen={true}
          onClose={() => setCreatingInStatus(null)}
          task={null}
          initialStatus={creatingInStatus}
          projectId={projectId}
          config={config}
        />
      )}

      {/* Panel de detalles */}
      <AnimatePresence>
        {selectedTask && (
          <TaskDetailPanel
            task={selectedTask}
            projectId={projectId}
            config={config}
            onClose={() => setSelectedTask(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}