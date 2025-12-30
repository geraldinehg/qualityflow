import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Pencil, Trash2, CalendarIcon, User, CheckCircle2, Circle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', color: 'bg-gray-500', icon: Circle },
  in_progress: { label: 'En Progreso', color: 'bg-blue-500', icon: Clock },
  completed: { label: 'Completada', color: 'bg-green-500', icon: CheckCircle2 }
};

const PRIORITY_CONFIG = {
  low: { label: 'Baja', color: 'bg-blue-500' },
  medium: { label: 'Media', color: 'bg-yellow-500' },
  high: { label: 'Alta', color: 'bg-red-500' }
};

export default function TasksView({ projectId }) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    due_date: null
  });

  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => base44.entities.Task.filter({ project_id: projectId }),
    enabled: !!projectId
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      setNewTask({ title: '', description: '', status: 'pending', priority: 'medium', due_date: null });
      setIsCreating(false);
      toast.success('Tarea creada');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      setEditingTask(null);
      toast.success('Tarea actualizada');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast.success('Tarea eliminada');
    }
  });

  const handleCreate = () => {
    if (!newTask.title.trim()) {
      toast.error('El título es obligatorio');
      return;
    }

    createMutation.mutate({
      ...newTask,
      project_id: projectId,
      due_date: newTask.due_date ? format(newTask.due_date, 'yyyy-MM-dd') : null,
      order: tasks.length
    });
  };

  const handleUpdate = (task, updates) => {
    updateMutation.mutate({
      id: task.id,
      data: {
        ...task,
        ...updates,
        due_date: updates.due_date ? format(updates.due_date, 'yyyy-MM-dd') : task.due_date
      }
    });
  };

  const handleDelete = (task) => {
    if (window.confirm('¿Eliminar esta tarea?')) {
      deleteMutation.mutate(task.id);
    }
  };

  const canEdit = (task) => {
    return currentUser && task.created_by === currentUser.email;
  };

  const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {/* Header con botón de crear */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Tareas del Proyecto</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {tasks.length} {tasks.length === 1 ? 'tarea' : 'tareas'} • {tasks.filter(t => t.status === 'completed').length} completadas
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-[#FF1B7E] hover:bg-[#e6156e] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Tarea
        </Button>
      </div>

      {/* Formulario de creación */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
              <CardContent className="pt-6 space-y-4">
                <Input
                  placeholder="Título de la tarea *"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-primary)]"
                />
                <Textarea
                  placeholder="Descripción (opcional)"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-primary)] h-20"
                />
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-[var(--text-secondary)] mb-1 block">Estado</label>
                    <Select value={newTask.status} onValueChange={(value) => setNewTask({ ...newTask, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>{config.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-secondary)] mb-1 block">Prioridad</label>
                    <Select value={newTask.priority} onValueChange={(value) => setNewTask({ ...newTask, priority: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>{config.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-secondary)] mb-1 block">Fecha vencimiento</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newTask.due_date ? format(newTask.due_date, "d MMM", { locale: es }) : "Opcional"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={newTask.due_date}
                          onSelect={(date) => {
                            setNewTask({ ...newTask, due_date: date });
                            document.body.click();
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreate} disabled={createMutation.isPending} className="bg-[#FF1B7E] hover:bg-[#e6156e]">
                    Crear Tarea
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de tareas */}
      <div className="space-y-3">
        <AnimatePresence>
          {sortedTasks.map((task) => {
            const statusConfig = STATUS_CONFIG[task.status];
            const priorityConfig = PRIORITY_CONFIG[task.priority];
            const StatusIcon = statusConfig.icon;
            const isEditing = editingTask?.id === task.id;
            const userCanEdit = canEdit(task);

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className={`bg-[var(--bg-secondary)] border-[var(--border-primary)] hover:border-[var(--border-secondary)] transition-all ${task.status === 'completed' ? 'opacity-75' : ''}`}>
                  <CardContent className="pt-4">
                    {isEditing ? (
                      <div className="space-y-3">
                        <Input
                          value={editingTask.title}
                          onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                          className="bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-primary)]"
                        />
                        <Textarea
                          value={editingTask.description || ''}
                          onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                          className="bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-primary)] h-20"
                        />
                        <div className="grid grid-cols-3 gap-3">
                          <Select value={editingTask.status} onValueChange={(value) => setEditingTask({ ...editingTask, status: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                <SelectItem key={key} value={key}>{config.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={editingTask.priority} onValueChange={(value) => setEditingTask({ ...editingTask, priority: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                                <SelectItem key={key} value={key}>{config.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {editingTask.due_date ? format(new Date(editingTask.due_date), "d MMM", { locale: es }) : "Sin fecha"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={editingTask.due_date ? new Date(editingTask.due_date) : undefined}
                                onSelect={(date) => {
                                  setEditingTask({ ...editingTask, due_date: date });
                                  document.body.click();
                                }}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setEditingTask(null)}>
                            Cancelar
                          </Button>
                          <Button onClick={() => handleUpdate(task, editingTask)} className="bg-[#FF1B7E] hover:bg-[#e6156e]">
                            Guardar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start gap-3">
                            <StatusIcon className={`h-5 w-5 mt-0.5 ${statusConfig.color.replace('bg-', 'text-')}`} />
                            <div className="flex-1">
                              <h3 className={`font-medium text-[var(--text-primary)] ${task.status === 'completed' ? 'line-through' : ''}`}>
                                {task.title}
                              </h3>
                              {task.description && (
                                <p className="text-sm text-[var(--text-secondary)] mt-1">{task.description}</p>
                              )}
                              <div className="flex items-center gap-3 mt-2 flex-wrap">
                                <Badge className={`${priorityConfig.color} text-white border-0 text-xs`}>
                                  {priorityConfig.label}
                                </Badge>
                                <Badge className={`${statusConfig.color} text-white border-0 text-xs`}>
                                  {statusConfig.label}
                                </Badge>
                                {task.due_date && (
                                  <Badge variant="outline" className="text-xs">
                                    <CalendarIcon className="h-3 w-3 mr-1" />
                                    {format(new Date(task.due_date), "d MMM", { locale: es })}
                                  </Badge>
                                )}
                                <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                                  <User className="h-3 w-3" />
                                  {task.created_by}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {userCanEdit && (
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setEditingTask(task)}
                              className="h-8 w-8"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(task)}
                              className="h-8 w-8 text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {tasks.length === 0 && !isCreating && (
          <div className="text-center py-12">
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-[var(--text-tertiary)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Sin tareas</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Comienza agregando la primera tarea del proyecto
            </p>
            <Button onClick={() => setIsCreating(true)} className="bg-[#FF1B7E] hover:bg-[#e6156e]">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Tarea
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}