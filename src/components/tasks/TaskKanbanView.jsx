import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import TaskFormModal from './TaskFormModal';

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
  const [editingTask, setEditingTask] = useState(null);
  const [creatingInStatus, setCreatingInStatus] = useState(null);

  const queryClient = useQueryClient();

  const { data: config } = useQuery({
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
    enabled: !!projectId
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => base44.entities.Task.filter({ project_id: projectId }),
    enabled: !!projectId
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast.success('Tarea eliminada');
    }
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    // Si cambió de columna (estado)
    if (source.droppableId !== destination.droppableId) {
      const task = tasks.find(t => t.id === draggableId);
      if (task) {
        updateMutation.mutate({
          id: task.id,
          data: { status: destination.droppableId }
        });
      }
    }
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

  return (
    <div className="space-y-4">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${statuses.length}, minmax(300px, 1fr))` }}>
          {statuses.map((status) => {
            const statusTasks = tasks.filter(t => t.status === status.key);
            const statusColor = COLOR_MAP[status.color] || 'bg-gray-500';

            return (
              <div key={status.key} className="flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${statusColor}`} />
                    <h3 className="font-semibold text-[var(--text-primary)]">{status.label}</h3>
                    <Badge variant="outline" className="text-xs">{statusTasks.length}</Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setCreatingInStatus(status.key)}
                    className="h-7 w-7 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <Droppable droppableId={status.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 space-y-2 p-2 rounded-lg min-h-[200px] transition-colors ${
                        snapshot.isDraggingOver ? 'bg-[var(--bg-tertiary)]' : 'bg-[var(--bg-secondary)]'
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
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -20 }}
                                >
                                  <Card className={`cursor-move ${snapshot.isDragging ? 'shadow-lg' : ''} bg-[var(--bg-card)] border-[var(--border-primary)]`}>
                                    <CardContent className="pt-4 pb-3">
                                      <div className="flex items-start gap-2">
                                        <div {...provided.dragHandleProps} className="mt-1">
                                          <GripVertical className="h-4 w-4 text-[var(--text-tertiary)]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h4 className="font-medium text-sm text-[var(--text-primary)] mb-2">{task.title}</h4>
                                          {task.description && (
                                            <p className="text-xs text-[var(--text-secondary)] mb-2 line-clamp-2">{task.description}</p>
                                          )}
                                          {priority && (
                                            <Badge className={`${priority.color} text-white border-0 text-xs`}>
                                              {priority.label}
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="flex gap-1">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setEditingTask(task)}
                                            className="h-6 w-6 p-0"
                                          >
                                            <Pencil className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                              if (confirm('¿Eliminar esta tarea?')) {
                                                deleteMutation.mutate(task.id);
                                              }
                                            }}
                                            className="h-6 w-6 p-0 text-red-500"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
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
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {(editingTask || creatingInStatus) && (
        <TaskFormModal
          isOpen={true}
          onClose={() => {
            setEditingTask(null);
            setCreatingInStatus(null);
          }}
          task={editingTask}
          initialStatus={creatingInStatus}
          projectId={projectId}
          config={config}
        />
      )}
    </div>
  );
}