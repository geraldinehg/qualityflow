import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, Calendar as CalendarIcon, User, Clock, Tag, Trash2, Save, Loader2 } from 'lucide-react';
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

export default function TaskDetailPanel({ task, projectId, config, onClose }) {
  const [formData, setFormData] = useState(task || {});
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    setFormData(task || {});
    setHasChanges(false);
  }, [task]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      setHasChanges(false);
      setIsSaving(false);
      toast.success('✅ Cambios guardados', { duration: 2000 });
    },
    onError: (error) => {
      setIsSaving(false);
      toast.error(`❌ Error al guardar: ${error.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast.success('Tarea eliminada');
      onClose();
    }
  });

  const handleUpdate = (updates) => {
    const newData = { ...formData, ...updates };
    setFormData(newData);
    setHasChanges(true);
    
    // Auto-save después de 1 segundo
    clearTimeout(window._taskAutoSaveTimeout);
    window._taskAutoSaveTimeout = setTimeout(() => {
      handleSave(newData);
    }, 1000);
  };

  const handleSave = (dataToSave = formData) => {
    if (!task?.id) return;
    setIsSaving(true);
    updateMutation.mutate({ id: task.id, data: dataToSave });
  };

  const handleDelete = () => {
    if (!window.confirm('¿Eliminar esta tarea?')) return;
    deleteMutation.mutate(task.id);
  };

  const renderCustomField = (field) => {
    const value = formData.custom_fields?.[field.key];

    switch (field.type) {
      case 'text':
        return (
          <Input
            value={value || ''}
            onChange={(e) => handleUpdate({
              custom_fields: { ...(formData.custom_fields || {}), [field.key]: e.target.value }
            })}
            placeholder={field.label}
            className="bg-[var(--bg-input)]"
          />
        );
      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => handleUpdate({
              custom_fields: { ...(formData.custom_fields || {}), [field.key]: e.target.value }
            })}
            placeholder={field.label}
            className="bg-[var(--bg-input)] h-24"
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => handleUpdate({
              custom_fields: { ...(formData.custom_fields || {}), [field.key]: e.target.value }
            })}
            placeholder={field.label}
            className="bg-[var(--bg-input)]"
          />
        );
      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), "d 'de' MMMM, yyyy", { locale: es }) : 'Seleccionar fecha'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white" align="start">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => {
                  handleUpdate({
                    custom_fields: { 
                      ...(formData.custom_fields || {}), 
                      [field.key]: date ? format(date, 'yyyy-MM-dd') : null 
                    }
                  });
                  document.body.click();
                }}
                locale={es}
              />
            </PopoverContent>
          </Popover>
        );
      case 'checkbox':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleUpdate({
                custom_fields: { ...(formData.custom_fields || {}), [field.key]: e.target.checked }
              })}
              className="w-4 h-4 text-[#FF1B7E] rounded focus:ring-[#FF1B7E]"
            />
            <span className="text-sm text-[var(--text-secondary)]">Activado</span>
          </label>
        );
      case 'select':
        return (
          <Select
            value={value || ''}
            onValueChange={(val) => handleUpdate({
              custom_fields: { ...(formData.custom_fields || {}), [field.key]: val }
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Seleccionar ${field.label}`} />
            </SelectTrigger>
            <SelectContent className="bg-white">
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

  const priorityConfig = (config?.custom_priorities || []).reduce((acc, p) => {
    acc[p.key] = { label: p.label, color: COLOR_MAP[p.color] || 'bg-gray-500' };
    return acc;
  }, {});

  const statusConfig = (config?.custom_statuses || []).reduce((acc, s) => {
    acc[s.key] = { label: s.label, color: COLOR_MAP[s.color] || 'bg-gray-500' };
    return acc;
  }, {});

  if (!task) return null;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed right-0 top-0 h-full w-full md:w-[600px] bg-white border-l border-[var(--border-primary)] shadow-2xl z-50 overflow-y-auto"
    >
      <div className="sticky top-0 bg-white border-b border-[var(--border-primary)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Detalles de la tarea</h2>
          {isSaving && (
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <Loader2 className="h-3 w-3 animate-spin" />
              Guardando...
            </div>
          )}
          {hasChanges && !isSaving && (
            <Badge variant="outline" className="text-xs">Sin guardar</Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-6 space-y-6">
        {/* Título */}
        <div>
          <Input
            value={formData.title || ''}
            onChange={(e) => handleUpdate({ title: e.target.value })}
            placeholder="Título de la tarea"
            className="text-xl font-semibold border-0 px-0 focus-visible:ring-0 bg-transparent"
          />
        </div>

        {/* Propiedades principales */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] mb-2 block flex items-center gap-1">
              <Tag className="h-3 w-3" />
              Estado
            </label>
            <Select
              value={formData.status || config?.custom_statuses?.[0]?.key}
              onValueChange={(value) => handleUpdate({ status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {(config?.custom_statuses || []).map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${COLOR_MAP[s.color] || 'bg-gray-500'}`} />
                      {s.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] mb-2 block flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Prioridad
            </label>
            <Select
              value={formData.priority || config?.custom_priorities?.[0]?.key}
              onValueChange={(value) => handleUpdate({ priority: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {(config?.custom_priorities || []).map((p) => (
                  <SelectItem key={p.key} value={p.key}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${COLOR_MAP[p.color] || 'bg-gray-500'}`} />
                      {p.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Fecha de vencimiento */}
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)] mb-2 block flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            Fecha de vencimiento
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.due_date ? format(new Date(formData.due_date), "d 'de' MMMM, yyyy", { locale: es }) : 'Sin fecha'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white" align="start">
              <Calendar
                mode="single"
                selected={formData.due_date ? new Date(formData.due_date) : undefined}
                onSelect={(date) => {
                  handleUpdate({ due_date: date ? format(date, 'yyyy-MM-dd') : null });
                  document.body.click();
                }}
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </div>

        <Separator />

        {/* Descripción */}
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)] mb-2 block">
            Descripción
          </label>
          <Textarea
            value={formData.description || ''}
            onChange={(e) => handleUpdate({ description: e.target.value })}
            placeholder="Agregar descripción..."
            className="bg-[var(--bg-input)] min-h-[120px]"
          />
        </div>

        {/* Campos personalizados */}
        {(config?.custom_fields || []).length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Campos personalizados</h3>
              {config.custom_fields.map((field) => (
                <div key={field.key}>
                  <label className="text-xs font-medium text-[var(--text-secondary)] mb-2 block">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {renderCustomField(field)}
                </div>
              ))}
            </div>
          </>
        )}

        <Separator />

        {/* Metadata */}
        <div className="text-xs text-[var(--text-secondary)] space-y-1">
          <div>Creado: {format(new Date(task.created_date), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}</div>
          {task.created_by && <div>Por: {task.created_by}</div>}
        </div>

        {/* Acciones */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={() => handleSave()}
            disabled={!hasChanges || isSaving}
            className="flex-1 bg-[#FF1B7E] hover:bg-[#e6156e]"
          >
            <Save className="h-4 w-4 mr-2" />
            Guardar ahora
          </Button>
          <Button
            onClick={handleDelete}
            variant="outline"
            className="text-red-500 border-red-200 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}