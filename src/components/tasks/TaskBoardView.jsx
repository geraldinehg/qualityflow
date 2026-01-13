import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, GripVertical, Search, Settings, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskConfiguration } from './hooks/useTaskConfiguration';
import { useProjectTasks } from './hooks/useProjectTasks';
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

/**
 * Vista de tablero Kanban para tareas de un proyecto
 * Componente presentacional que delega lógica a hooks
 */
export default function TaskBoardView({ projectId, onOpenConfig }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [creatingInStatus, setCreatingInStatus] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { config, isLoading: configLoading } = useTaskConfiguration(projectId);
  const { 
    tasks, 
    isLoading: tasksLoading, 
    updateTask, 
    isUpdating,
    getTasksByStatus 
  } = useProjectTasks(projectId, config);

  // Filtrar tareas por búsqueda
  const filteredTasks = React.useMemo(() => {
    if (!searchQuery) return tasks;
    const query = searchQuery.toLowerCase();
    return tasks.filter(t =>
      t.title?.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query)
    );
  }, [tasks, searchQuery]);

  // Manejar drag & drop
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;

    // Cambio de columna (estado)
    if (source.droppableId !== destination.droppableId) {
      updateTask({
        taskId: task.id,
        updates: { status: destination.droppableId }
      });
    }

    // Reordenar en la misma columna
    if (source.droppableId === destination.droppableId && source.index !== destination.index) {
      const columnTasks = getTasksByStatus(source.droppableId);
      const [movedTask] = columnTasks.splice(source.index, 1);
      columnTasks.splice(destination.index, 0, movedTask);

      // Actualizar orden
      columnTasks.forEach((t, index) => {
        if (t.order !== index) {
          updateTask({ taskId: t.id, updates: { order: index } });
        }
      });
    }
  };

  // Estados de carga
  if (configLoading || tasksLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF1B7E] mx-auto" />
        <p className="text-sm text-[var(--text-secondary)] mt-4">Cargando tablero...</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--text-secondary)]">Error al cargar configuración</p>
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
      {/* Barra de herramientas */}
      <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
        <CardContent className="pt-4">
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
            
            <Button
              onClick={onOpenConfig}
              variant="outline"
              className="bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-primary)]"
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurar
            </Button>
          </div>

          <div className="mt-2 text-xs text-[var(--text-secondary)]">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'tarea' : 'tareas'}
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
                {/* Header */}
                <div className="flex items-center justify-between mb-3 px-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${statusColor}`} />
                    <h3 className="font-semibold text-[var(--text-primary)]">{status.label}</h3>
                    <Badge variant="outline" className="text-xs">{statusTasks.length}</Badge>
                    {status.is_final && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setCreatingInStatus(status.key)}
                    className="h-7 w-7 p-0 hover:bg-[#FF1B7E] hover:text-white"
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
                                >
                                  <Card 
                                    className={`cursor-pointer hover:shadow-md group ${
                                      snapshot.isDragging ? 'shadow-2xl ring-2 ring-[#FF1B7E]' : 'shadow-sm'
                                    } bg-white`}
                                    onClick={() => setSelectedTask(task)}
                                  >
                                    <CardContent className="pt-4 pb-3">
                                      <div className="flex items-start gap-3">
                                        <div 
                                          {...provided.dragHandleProps} 
                                          className="mt-1 opacity-0 group-hover:opacity-100"
                                        >
                                          <GripVertical className="h-4 w-4 text-[var(--text-tertiary)]" />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                          <h4 className="font-medium text-sm text-[var(--text-primary)]">
                                            {task.title}
                                          </h4>
                                          {task.description && (
                                            <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                                              {task.description}
                                            </p>
                                          )}
                                          <div className="flex items-center gap-2 flex-wrap">
                                            {priority && (
                                              <Badge className={`${priority.color} text-white text-xs`}>
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

      {/* Modales */}
      {creatingInStatus && (
        <TaskFormModal
          isOpen={true}
          onClose={() => setCreatingInStatus(null)}
          initialStatus={creatingInStatus}
          projectId={projectId}
          config={config}
        />
      )}

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