import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

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

export default function TaskFormModal({ isOpen, onClose, task, initialStatus, projectId, config }) {
  const [formData, setFormData] = useState(() => ({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || initialStatus || config?.custom_statuses?.[0]?.key,
    priority: task?.priority || config?.custom_priorities?.[0]?.key,
    assigned_to: task?.assigned_to || [],
    custom_fields: task?.custom_fields || {}
  }));
  const [uploadingFields, setUploadingFields] = useState({});

  const queryClient = useQueryClient();

  // Cargar miembros del equipo
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => base44.entities.TeamMember.filter({ is_active: true })
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const currentUser = await base44.auth.me();
      
      // Agregar metadata de creación
      data.assigned_by = currentUser.email;
      
      const newTask = await base44.entities.Task.create(data);
      
      // Log de actividad
      await base44.entities.TaskActivityLog.create({
        task_id: newTask.id,
        project_id: projectId,
        action_type: 'created',
        action_by: currentUser.email,
        action_by_name: currentUser.full_name,
        new_value: data
      });
      
      // Si hay un usuario asignado, enviar notificación
      if (data.assigned_to?.[0]) {
        try {
          const projects = await base44.entities.Project.filter({ id: projectId });
          const project = projects[0];
          const assignedMember = teamMembers.find(m => m.user_email === data.assigned_to[0]);
          
          await base44.functions.invoke('sendTaskNotification', {
            taskId: newTask.id,
            projectId: projectId,
            notificationType: 'task_created',
            recipientEmail: data.assigned_to[0],
            recipientName: assignedMember?.display_name,
            taskTitle: data.title,
            taskDescription: data.description,
            projectName: project?.name
          });
          toast.success('✉️ Notificación enviada al asignado');
        } catch (error) {
          console.error('Error enviando notificación:', error);
        }
      }
      
      return newTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast.success('✅ Tarea creada correctamente', { duration: 2000 });
      onClose();
    },
    onError: (error) => {
      toast.error(`❌ Error al crear: ${error.message}`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast.success('✅ Tarea actualizada correctamente', { duration: 2000 });
      onClose();
    },
    onError: (error) => {
      toast.error(`❌ Error al actualizar: ${error.message}`);
    }
  });

  const handleSubmit = () => {
    if (!formData.title?.trim()) {
      toast.error('El título es obligatorio');
      return;
    }

    // Validar campos personalizados obligatorios
    const customFields = config?.custom_fields || [];
    for (const field of customFields) {
      if (field.required && field.visible && !formData.custom_fields[field.key]) {
        toast.error(`El campo ${field.label} es obligatorio`);
        return;
      }
    }

    const data = {
      ...formData,
      project_id: projectId
    };

    if (task) {
      updateMutation.mutate({ id: task.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const renderCustomField = (field) => {
    if (!field.visible) return null;

    const value = formData.custom_fields[field.key];
    const isDisabled = !field.editable;

    const updateField = (newValue) => {
      setFormData({
        ...formData,
        custom_fields: {
          ...formData.custom_fields,
          [field.key]: newValue
        }
      });
    };

    switch (field.type) {
      case 'text':
        return (
          <Input
            placeholder={field.label}
            value={value || field.default_value || ''}
            onChange={(e) => updateField(e.target.value)}
            disabled={isDisabled}
            className="bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-primary)]"
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            placeholder={field.label}
            value={value || field.default_value || ''}
            onChange={(e) => updateField(e.target.value)}
            disabled={isDisabled}
            className="bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-primary)] h-20"
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            placeholder={field.label}
            value={value || field.default_value || ''}
            onChange={(e) => updateField(e.target.value)}
            disabled={isDisabled}
            className="bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-primary)]"
          />
        );
      
      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start" disabled={isDisabled}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), "d MMM yyyy", { locale: es }) : field.label}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => {
                  updateField(date ? format(date, 'yyyy-MM-dd') : null);
                  document.body.click();
                }}
              />
            </PopoverContent>
          </Popover>
        );
      
      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={value === 'true' || value === true}
              onCheckedChange={(checked) => updateField(checked ? 'true' : 'false')}
              disabled={isDisabled}
            />
            <label className="text-sm text-[var(--text-primary)]">{field.label}</label>
          </div>
        );
      
      case 'select':
        return (
          <Select
            value={value || field.default_value || ''}
            onValueChange={updateField}
            disabled={isDisabled}
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
      
      case 'file':
        return (
          <div className="space-y-2">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.svg,.png,.jpg,.jpeg,.webp"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                
                // Validar tamaño (máx 10MB)
                if (file.size > 10 * 1024 * 1024) {
                  toast.error('El archivo no puede superar 10MB');
                  return;
                }
                
                setUploadingFields({ ...uploadingFields, [field.key]: true });
                
                try {
                  const { file_url } = await base44.integrations.Core.UploadFile({ file });
                  updateField(file_url);
                  toast.success('Archivo subido correctamente');
                } catch (error) {
                  toast.error('Error al subir archivo');
                } finally {
                  setUploadingFields({ ...uploadingFields, [field.key]: false });
                }
              }}
              disabled={isDisabled || uploadingFields[field.key]}
              className="hidden"
              id={`file-${field.key}`}
            />
            
            {!value ? (
              <label htmlFor={`file-${field.key}`}>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={isDisabled || uploadingFields[field.key]}
                  asChild
                >
                  <span>
                    {uploadingFields[field.key] ? (
                      <>Subiendo...</>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Seleccionar archivo
                      </>
                    )}
                  </span>
                </Button>
              </label>
            ) : (
              <div className="flex items-center gap-2 p-2 bg-[var(--bg-tertiary)] rounded border border-[var(--border-primary)]">
                {value.match(/\.(svg|png|jpg|jpeg|webp)$/i) ? (
                  <ImageIcon className="h-4 w-4 text-[var(--text-secondary)]" />
                ) : (
                  <FileText className="h-4 w-4 text-[var(--text-secondary)]" />
                )}
                <a 
                  href={value} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 text-xs text-[var(--text-primary)] hover:underline truncate"
                >
                  {value.split('/').pop()}
                </a>
                {!isDisabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => updateField(null)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  const statuses = (config?.custom_statuses || []).sort((a, b) => a.order - b.order);
  const priorities = (config?.custom_priorities || []).sort((a, b) => a.order - b.order);
  const customFields = config?.custom_fields || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-[var(--bg-secondary)] border-[var(--border-primary)]">
        <DialogHeader>
          <DialogTitle className="text-[var(--text-primary)]">
            {task ? 'Editar Tarea' : 'Nueva Tarea'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="text-xs text-[var(--text-secondary)] mb-1 block">Título *</label>
            <Input
              placeholder="Título de la tarea"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-primary)]"
            />
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)] mb-1 block">Descripción</label>
            <Textarea
              placeholder="Descripción de la tarea"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-primary)] h-20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1 block">Estado</label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1 block">Prioridad</label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((p) => (
                    <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)] mb-1 block">Asignado a</label>
            <Select
              value={(formData.assigned_to || [])[0] || 'unassigned'}
              onValueChange={(value) => {
                const newAssigned = value === 'unassigned' ? [] : [value];
                setFormData({ ...formData, assigned_to: newAssigned });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin asignar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Sin asignar</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.user_email} value={member.user_email}>
                    {member.display_name || member.user_email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {customFields.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-[var(--border-primary)]">
              <h4 className="text-sm font-medium text-[var(--text-primary)]">Campos adicionales</h4>
              {customFields.map((field) => (
                <div key={field.key}>
                  <label className="text-xs text-[var(--text-secondary)] mb-1 block">
                    {field.label} {field.required && '*'}
                  </label>
                  {renderCustomField(field)}
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={createMutation.isPending || updateMutation.isPending}
            className="bg-[#FF1B7E] hover:bg-[#e6156e] text-white"
          >
            {task ? 'Guardar' : 'Crear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}