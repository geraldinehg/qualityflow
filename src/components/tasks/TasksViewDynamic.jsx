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
import { Plus, Pencil, Trash2, CalendarIcon, User, CheckCircle2, Circle, Clock, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function TasksViewDynamic({ projectId }) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newTask, setNewTask] = useState({});

  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: config } = useQuery({
    queryKey: ['task-configurations'],
    queryFn: async () => {
      const configs = await base44.entities.TaskConfiguration.list('-created_date');
      return configs[0] || null;
    }
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list()
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
      setNewTask({});
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
    if (!newTask.title?.trim()) {
      toast.error('El título es obligatorio');
      return;
    }

    // Validar campos requeridos
    const requiredFields = config?.required_fields || ['title'];
    for (const field of requiredFields) {
      if (!newTask[field]) {
        toast.error(`El campo ${field} es obligatorio`);
        return;
      }
    }

    createMutation.mutate({
      ...newTask,
      project_id: projectId,
      order: tasks?.length || 0,
      due_date: newTask.due_date ? format(newTask.due_date, 'yyyy-MM-dd') : null
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
    // Implementar permisos según config
    return currentUser && task.created_by === currentUser.email;
  };

  const renderCustomField = (field, value, onChange, task = null) => {
    const fieldValue = task ? task.custom_fields?.[field.key] : value;
    
    switch (field.type) {
      case 'text':
        return (
          <Input
            placeholder={field.label}
            value={fieldValue || ''}
            onChange={(e) => {
              if (task) {
                onChange({ ...task, custom_fields: { ...task.custom_fields, [field.key]: e.target.value } });
              } else {
                onChange({ ...value, custom_fields: { ...(value.custom_fields || {}), [field.key]: e.target.value } });
              }
            }}
            className="bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-primary)]"
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            placeholder={field.label}
            value={fieldValue || ''}
            onChange={(e) => {
              if (task) {
                onChange({ ...task, custom_fields: { ...task.custom_fields, [field.key]: e.target.value } });
              } else {
                onChange({ ...value, custom_fields: { ...(value.custom_fields || {}), [field.key]: e.target.value } });
              }
            }}
            className="bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-primary)]"
          />
        );
      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {fieldValue ? format(new Date(fieldValue), "d MMM", { locale: es }) : field.label}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={fieldValue ? new Date(fieldValue) : undefined}
                onSelect={(date) => {
                  const formatted = date ? format(date, 'yyyy-MM-dd') : null;
                  if (task) {
                    onChange({ ...task, custom_fields: { ...task.custom_fields, [field.key]: formatted } });
                  } else {
                    onChange({ ...value, custom_fields: { ...(value.custom_fields || {}), [field.key]: formatted } });
                  }
                  document.body.click();
                }}
              />
            </PopoverContent>
          </Popover>
        );
      case 'select':
        return (
          <Select
            value={fieldValue || ''}
            onValueChange={(val) => {
              if (task) {
                onChange({ ...task, custom_fields: { ...task.custom_fields, [field.key]: val } });
              } else {
                onChange({ ...value, custom_fields: { ...(value.custom_fields || {}), [field.key]: val } });
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.label} />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return null;
    }
  };

  if (!config || !config.module_enabled) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--text-secondary)]">El módulo de tareas está deshabilitado</p>
      </div>
    );
  }

  const statusConfig = (config?.custom_statuses || []).reduce((acc, s) => {
    acc[s.key] = { label: s.label, color: COLOR_MAP[s.color] || 'bg-gray-500' };
    return acc;
  }, {});

  const priorityConfig = (config?.custom_priorities || []).reduce((acc, p) => {
    acc[p.key] = { label: p.label, color: COLOR_MAP[p.color] || 'bg-gray-500' };
    return acc;
  }, {});

  const sortedTasks = [...(tasks || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  const enabledFields = config?.enabled_fields || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Tareas del Proyecto</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {tasks?.length || 0} {(tasks?.length || 0) === 1 ? 'tarea' : 'tareas'}
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="bg-[#FF1B7E] hover:bg-[#e6156e] text-white">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Tarea
        </Button>
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
              <CardContent className="pt-6 space-y-4">
                {enabledFields.title && (
                  <div>
                    <label className="text-xs text-[var(--text-secondary)] mb-1 block">Título *</label>
                    <Input
                      placeholder="Título de la tarea"
                      value={newTask.title || ''}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      className="bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-primary)]"
                    />
                  </div>
                )}
                
                {enabledFields.description && (
                  <div>
                    <label className="text-xs text-[var(--text-secondary)] mb-1 block">Descripción</label>
                    <Textarea
                      placeholder="Descripción"
                      value={newTask.description || ''}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      className="bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-primary)] h-20"
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  {enabledFields.status && (
                    <div>
                      <label className="text-xs text-[var(--text-secondary)] mb-1 block">Estado</label>
                      <Select value={newTask.status || config?.custom_statuses?.[0]?.key} onValueChange={(value) => setNewTask({ ...newTask, status: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(config?.custom_statuses || []).map((s) => (
                            <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {enabledFields.priority && (
                    <div>
                      <label className="text-xs text-[var(--text-secondary)] mb-1 block">Prioridad</label>
                      <Select value={newTask.priority || config?.custom_priorities?.[0]?.key} onValueChange={(value) => setNewTask({ ...newTask, priority: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(config?.custom_priorities || []).map((p) => (
                            <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {enabledFields.due_date && (
                    <div>
                      <label className="text-xs text-[var(--text-secondary)] mb-1 block">Fecha vencimiento</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newTask.due_date ? format(newTask.due_date, "d MMM", { locale: es }) : "Seleccionar"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
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
                  )}
                  
                  {enabledFields.assigned_to && (
                    <div>
                      <label className="text-xs text-[var(--text-secondary)] mb-1 block">Asignado a</label>
                      <Select
                        value={newTask.assigned_to?.[0] || ''}
                        onValueChange={(value) => setNewTask({ ...newTask, assigned_to: value ? [value] : [] })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar usuario" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>Sin asignar</SelectItem>
                          {allUsers.map((user) => (
                            <SelectItem key={user.id} value={user.email}>
                              {user.full_name || user.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                
                {(config?.custom_fields || []).map((field) => (
                  <div key={field.key}>
                    <label className="text-xs text-[var(--text-secondary)] mb-1 block">
                      {field.label} {field.required && '*'}
                    </label>
                    {renderCustomField(field, newTask, setNewTask)}
                  </div>
                ))}
                
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsCreating(false)}>Cancelar</Button>
                  <Button onClick={handleCreate} disabled={createMutation.isPending} className="bg-[#FF1B7E] hover:bg-[#e6156e]">
                    Crear Tarea
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        <AnimatePresence>
          {sortedTasks.map((task) => {
            const taskStatus = statusConfig[task.status];
            const taskPriority = priorityConfig[task.priority];
            const isEditing = editingTask?.id === task.id;
            const userCanEdit = canEdit(task);

            return (
              <motion.div key={task.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card className={`bg-[var(--bg-secondary)] border-[var(--border-primary)] hover:border-[var(--border-secondary)] transition-all`}>
                  <CardContent className="pt-4">
                    {isEditing ? (
                      <div className="space-y-3">
                        <Input
                          value={editingTask.title}
                          onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                          className="bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-primary)]"
                        />
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setEditingTask(null)}>Cancelar</Button>
                          <Button onClick={() => handleUpdate(task, editingTask)} className="bg-[#FF1B7E] hover:bg-[#e6156e]">
                            Guardar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <h3 className="font-medium text-[var(--text-primary)]">{task.title}</h3>
                          {task.description && (
                            <p className="text-sm text-[var(--text-secondary)]">{task.description}</p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            {taskPriority && (
                              <Badge className={`${taskPriority.color} text-white border-0 text-xs`}>
                                {taskPriority.label}
                              </Badge>
                            )}
                            {taskStatus && (
                              <Badge className={`${taskStatus.color} text-white border-0 text-xs`}>
                                {taskStatus.label}
                              </Badge>
                            )}
                            {(task.assigned_to?.length ?? 0) > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <User className="h-3 w-3 mr-1" />
                                {allUsers.find(u => u.email === task.assigned_to?.[0])?.full_name || task.assigned_to?.[0]}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {userCanEdit && (
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => setEditingTask(task)} className="h-8 w-8">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(task)} className="h-8 w-8 text-red-500">
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

        {(tasks?.length || 0) === 0 && !isCreating && (
          <div className="text-center py-12">
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-[var(--text-tertiary)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Sin tareas</h3>
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