import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, GripVertical, Search, Filter, X, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import TaskFormModal from './TaskFormModal';
import TaskDetailPanel from './TaskDetailPanel';

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

  const queryClient = useQueryClient();

  const { data: config, refetch: refetchConfig } = useQuery({
    queryKey: ['task-configuration', projectId],
    queryFn: async () => {
      const projectConfigs = await base44.entities.TaskConfiguration.filter({ project_id: projectId });
      if (projectConfigs && projectConfigs.length > 0) {
        return projectConfigs[0];
      }
      
      const allConfigs = await base44.entities.TaskConfiguration.list('-created_date');
      const globalConfigs = (allConfigs || []).filter(c => !c.project_id);
      if (globalConfigs.length > 0) {
        return globalConfigs[0];
      }
      
      return null;
    },
    enabled: !!projectId,
    refetchOnWindowFocus: true,
    staleTime: 0
  });

  // Refetch cuando se actualizan las configuraciones
  React.useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.query?.queryKey?.[0] === 'task-configuration' && event?.type === 'updated') {
        refetchConfig();
      }
    });
    return unsubscribe;
  }, [queryClient, refetchConfig]);

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => base44.entities.Task.filter({ project_id: projectId }),
    enabled: !!projectId
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
    onError: (error) => {
      console.error('Error updating task:', error);
      toast.error(`Error al actualizar: ${error.message}`);
    }
  });

  // Filtrado avanzado
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    // Búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title?.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query)
      );
    }

    // Filtro de prioridad
    if (filterPriority !== 'all') {
      filtered = filtered.filter((t) => t.priority === filterPriority);
    }

    // Filtros de campos personalizados
    Object.keys(filterCustomField).forEach((fieldKey) => {
      const fieldValue = filterCustomField[fieldKey];
      if (fieldValue && fieldValue !== 'all') {
        filtered = filtered.filter((t) => t.custom_fields?.[fieldKey] === fieldValue);
      }
    });

    return filtered;
  }, [tasks, searchQuery, filterPriority, filterCustomField]);

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
        toast.error(`Completa los campos obligatorios: ${missingFields.map(f => f.label).join(', ')}`);
        return;
      }
    }

    // Cambio de columna (estado)
    if (source.droppableId !== destination.droppableId) {
      const optimisticUpdate = tasks.map(t => 
        t.id === task.id ? { ...t, status: destination.droppableId } : t
      );
      queryClient.setQueryData(['tasks', projectId], optimisticUpdate);

      try {
        await updateMutation.mutateAsync({
          id: task.id,
          data: { status: destination.droppableId }
        });
        
        // Feedback visual
        toast.success(`Tarea movida a ${destinationStatus?.label || destination.droppableId}`, {
          duration: 2000
        });

        // Disparar notificaciones si aplica
        await triggerTaskNotifications(task, destination.droppableId);
      } catch (error) {
        // Revertir en caso de error
        queryClient.setQueryData(['tasks', projectId], tasks);
        toast.error('Error al mover la tarea');
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
      const updates = columnTasks.map((t, index) => 
        updateMutation.mutateAsync({ id: t.id, data: { order: index } })
      );
      
      await Promise.all(updates);
    }
  };

  const triggerTaskNotifications = async (task, newStatus) => {
    try {
      // Buscar reglas de notificación aplicables
      const rules = await base44.entities.TaskNotificationRule.filter({
        project_id: projectId,
        is_active: true
      });

      const statusChangedRules = rules.filter(r => 
        r.trigger_event === 'status_changed' && 
        (!r.conditions?.status || r.conditions.status === newStatus)
      );

      // Ejecutar notificaciones
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

  if (!config || config.module_enabled === false) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--text-secondary)]">El módulo de tareas está deshabilitado para este proyecto</p>
      </div>
    );
  }

  const statuses = (config.custom_statuses || []).sort((a, b) => a.order - b.order);
  const priorities = (config.custom_priorities || []).reduce((acc, p) => {
    acc[p.key] = { label: p.label, color: COLOR_MAP[p.color] || 'bg-gray-500' };
    return acc;
  }, {});

  const hasActiveFilters = searchQuery || filterPriority !== 'all' || Object.keys(filterCustomField).length > 0;

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda y filtros */}
      <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
        <CardContent className="pt-4">
          <div className="flex flex-col gap-3">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
              <Input
                placeholder="Buscar tareas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[var(--bg-input)]"
              />
            </div>

            {/* Filtros */}
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

              {/* Filtros por campos personalizados de tipo select */}
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
                                    className={`cursor-pointer transition-all hover:shadow-md group ${
                                      snapshot.isDragging 
                                        ? 'shadow-2xl ring-2 ring-[#FF1B7E] rotate-2' 
                                        : 'shadow-sm'
                                    } bg-white border-[var(--border-primary)]`}
                                    onClick={() => handleTaskClick(task)}
                                  >
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