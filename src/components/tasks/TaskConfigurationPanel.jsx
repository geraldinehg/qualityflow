import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import TaskFormManager from './TaskFormManager';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, GripVertical, Save, AlertCircle } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'sonner';

const DEFAULT_CONFIG = {
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
};

const COLOR_OPTIONS = [
  { value: 'gray', label: 'Gris' },
  { value: 'blue', label: 'Azul' },
  { value: 'green', label: 'Verde' },
  { value: 'yellow', label: 'Amarillo' },
  { value: 'red', label: 'Rojo' },
  { value: 'purple', label: 'Morado' },
  { value: 'pink', label: 'Rosa' },
  { value: 'orange', label: 'Naranja' }
];

const FIELD_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'textarea', label: 'Texto largo' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Fecha' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'select', label: 'Select' }
];

export default function TaskConfigurationPanel({ projectId }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [newOption, setNewOption] = useState('');

  const queryClient = useQueryClient();

  const { data: configurations = [], isLoading } = useQuery({
    queryKey: projectId ? ['task-configuration', projectId] : ['task-configurations'],
    queryFn: async () => {
      if (projectId) {
        const configs = await base44.entities.TaskConfiguration.filter({ project_id: projectId });
        return configs || [];
      } else {
        const allConfigs = await base44.entities.TaskConfiguration.list('-created_date');
        return (allConfigs || []).filter(c => !c.project_id);
      }
    }
  });

  React.useEffect(() => {
    if (configurations && configurations.length > 0) {
      setConfig(configurations[0]);
    } else {
      setConfig({ ...DEFAULT_CONFIG, project_id: projectId });
    }
  }, [configurations, projectId]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      try {
        const configData = { 
          module_enabled: data.module_enabled ?? true,
          custom_statuses: data.custom_statuses || [],
          custom_priorities: data.custom_priorities || [],
          custom_fields: data.custom_fields || [],
          project_id: projectId || null
        };
        
        let result;
        if (configurations && configurations.length > 0) {
          result = await base44.entities.TaskConfiguration.update(configurations[0].id, configData);
        } else {
          result = await base44.entities.TaskConfiguration.create(configData);
        }
        
        return result;
      } catch (error) {
        console.error('Error en mutationFn:', error);
        throw error;
      }
    },
    onSuccess: async (savedConfig) => {
      // Actualizar el estado local con la configuración guardada
      setConfig(savedConfig);
      
      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ['task-configuration'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      // Forzar refetch del kanban
      queryClient.refetchQueries({ queryKey: ['task-configuration', projectId] });
      
      toast.success('✓ Configuración guardada correctamente', { 
        duration: 3000 
      });
    },
    onError: (error) => {
      console.error('Error completo:', error);
      toast.error(`Error al guardar: ${error.message || 'Desconocido'}`);
    }
  });

  const handleSave = () => {
    // Validar que hay al menos un estado final
    const hasFinalStatus = config.custom_statuses?.some(s => s.is_final);
    if (!hasFinalStatus) {
      toast.error('Debe haber al menos un estado marcado como final');
      return;
    }

    // Validar que hay al menos un estado y una prioridad
    if (!config.custom_statuses || config.custom_statuses.length === 0) {
      toast.error('Debe haber al menos un estado');
      return;
    }
    
    if (!config.custom_priorities || config.custom_priorities.length === 0) {
      toast.error('Debe haber al menos una prioridad');
      return;
    }

    const toastId = toast.loading('💾 Guardando configuración...');
    
    saveMutation.mutate(config, {
      onSuccess: () => {
        toast.success('✅ Configuración guardada', { id: toastId, duration: 3000 });
      },
      onError: (error) => {
        toast.error(`❌ Error: ${error.message}`, { id: toastId });
      }
    });
  };

  const addStatus = () => {
    const newStatuses = [...(config.custom_statuses || [])];
    newStatuses.push({
      key: `status_${Date.now()}`,
      label: 'Nuevo Estado',
      color: 'gray',
      is_final: false,
      order: newStatuses.length
    });
    setConfig({ ...config, custom_statuses: newStatuses });
  };

  const updateStatus = (index, updates) => {
    const newStatuses = [...config.custom_statuses];
    newStatuses[index] = { ...newStatuses[index], ...updates };
    setConfig({ ...config, custom_statuses: newStatuses });
  };

  const deleteStatus = (index) => {
    if (config.custom_statuses.length <= 1) {
      toast.error('Debe haber al menos un estado');
      return;
    }
    const newStatuses = config.custom_statuses.filter((_, i) => i !== index);
    setConfig({ ...config, custom_statuses: newStatuses });
  };

  const handleStatusReorder = (result) => {
    if (!result.destination) return;
    const items = Array.from(config.custom_statuses);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    const reorderedItems = items.map((item, index) => ({ ...item, order: index }));
    setConfig({ ...config, custom_statuses: reorderedItems });
  };

  const addPriority = () => {
    const newPriorities = [...(config.custom_priorities || [])];
    newPriorities.push({
      key: `priority_${Date.now()}`,
      label: 'Nueva Prioridad',
      color: 'gray',
      order: newPriorities.length
    });
    setConfig({ ...config, custom_priorities: newPriorities });
  };

  const updatePriority = (index, updates) => {
    const newPriorities = [...config.custom_priorities];
    newPriorities[index] = { ...newPriorities[index], ...updates };
    setConfig({ ...config, custom_priorities: newPriorities });
  };

  const deletePriority = (index) => {
    if (config.custom_priorities.length <= 1) {
      toast.error('Debe haber al menos una prioridad');
      return;
    }
    const newPriorities = config.custom_priorities.filter((_, i) => i !== index);
    setConfig({ ...config, custom_priorities: newPriorities });
  };

  const addCustomField = () => {
    const newFields = [...(config.custom_fields || [])];
    newFields.push({
      key: `field_${Date.now()}`,
      label: 'Nuevo Campo',
      type: 'text',
      required: false,
      visible: true,
      editable: true,
      options: [],
      default_value: ''
    });
    setConfig({ ...config, custom_fields: newFields });
  };

  const updateCustomField = (index, updates) => {
    const newFields = [...config.custom_fields];
    newFields[index] = { ...newFields[index], ...updates };
    setConfig({ ...config, custom_fields: newFields });
  };

  const deleteCustomField = (index) => {
    const newFields = config.custom_fields.filter((_, i) => i !== index);
    setConfig({ ...config, custom_fields: newFields });
  };

  const addFieldOption = (fieldIndex) => {
    if (!newOption.trim()) return;
    const newFields = [...config.custom_fields];
    const field = newFields[fieldIndex];
    field.options = [...(field.options || []), newOption.trim()];
    setConfig({ ...config, custom_fields: newFields });
    setNewOption('');
  };

  const removeFieldOption = (fieldIndex, optIndex) => {
    const newFields = [...config.custom_fields];
    const field = newFields[fieldIndex];
    field.options = field.options.filter((_, i) => i !== optIndex);
    setConfig({ ...config, custom_fields: newFields });
  };

  if (isLoading) {
    return <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF1B7E] mx-auto" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-[var(--text-primary)]">
              Configuración del Módulo de Tareas {projectId && <Badge className="ml-2 bg-[#FF1B7E]">Proyecto Específico</Badge>}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-[#FF1B7E] hover:bg-[#e6156e]">
                <Save className="h-4 w-4 mr-2" />
                {saveMutation.isPending ? 'Guardando...' : 'Guardar Configuración'}
              </Button>
              <Switch
                checked={config.module_enabled}
                onCheckedChange={(checked) => setConfig({ ...config, module_enabled: checked })}
              />
              <span className="text-sm text-[var(--text-secondary)]">
                {config.module_enabled ? 'Habilitado' : 'Deshabilitado'}
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="statuses">
        <TabsList className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
          <TabsTrigger value="statuses">Estados (Columnas)</TabsTrigger>
          <TabsTrigger value="priorities">Prioridades</TabsTrigger>
          <TabsTrigger value="fields">Campos Personalizados</TabsTrigger>
          <TabsTrigger value="forms">Formularios Públicos</TabsTrigger>
        </TabsList>

        <TabsContent value="statuses" className="space-y-4">
          <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-[var(--text-primary)]">Estados del Kanban</CardTitle>
                <Button size="sm" onClick={addStatus} className="bg-[#FF1B7E] hover:bg-[#e6156e]">
                  <Plus className="h-4 w-4 mr-1" /> Agregar Estado
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] bg-[var(--bg-tertiary)] p-2 rounded">
                <AlertCircle className="h-4 w-4" />
                Los estados representan las columnas del tablero Kanban. Debe haber al menos un estado final.
              </div>

              <DragDropContext onDragEnd={handleStatusReorder}>
                <Droppable droppableId="statuses">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                      {(config.custom_statuses || []).map((status, index) => (
                        <Draggable key={status.key} draggableId={status.key} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="flex items-center gap-2 p-3 bg-[var(--bg-tertiary)] rounded border border-[var(--border-primary)]"
                            >
                              <div {...provided.dragHandleProps}>
                                <GripVertical className="h-4 w-4 text-[var(--text-tertiary)]" />
                              </div>
                              <Input
                                value={status.label}
                                onChange={(e) => updateStatus(index, { label: e.target.value })}
                                className="flex-1"
                              />
                              <Select value={status.color} onValueChange={(value) => updateStatus(index, { color: value })}>
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {COLOR_OPTIONS.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={status.is_final}
                                  onCheckedChange={(checked) => updateStatus(index, { is_final: checked })}
                                />
                                <span className="text-xs text-[var(--text-secondary)]">Final</span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteStatus(index)}
                                className="text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="priorities" className="space-y-4">
          <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-[var(--text-primary)]">Prioridades</CardTitle>
                <Button size="sm" onClick={addPriority} className="bg-[#FF1B7E] hover:bg-[#e6156e]">
                  <Plus className="h-4 w-4 mr-1" /> Agregar Prioridad
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {(config.custom_priorities || []).map((priority, index) => (
                <div key={priority.key} className="flex items-center gap-2 p-3 bg-[var(--bg-tertiary)] rounded border border-[var(--border-primary)]">
                  <Input
                    value={priority.label}
                    onChange={(e) => updatePriority(index, { label: e.target.value })}
                    className="flex-1"
                  />
                  <Select value={priority.color} onValueChange={(value) => updatePriority(index, { color: value })}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLOR_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deletePriority(index)}
                    className="text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fields" className="space-y-4">
          <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-[var(--text-primary)]">Campos Personalizados</CardTitle>
                <Button size="sm" onClick={addCustomField} className="bg-[#FF1B7E] hover:bg-[#e6156e]">
                  <Plus className="h-4 w-4 mr-1" /> Agregar Campo
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {(config.custom_fields || []).map((field, fieldIndex) => (
                <div key={field.key} className="p-4 bg-[var(--bg-tertiary)] rounded border border-[var(--border-primary)] space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Nombre del campo"
                      value={field.label}
                      onChange={(e) => updateCustomField(fieldIndex, { label: e.target.value })}
                      className="flex-1"
                    />
                    <Select value={field.type} onValueChange={(value) => updateCustomField(fieldIndex, { type: value })}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteCustomField(fieldIndex)}
                      className="text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={field.required}
                        onCheckedChange={(checked) => updateCustomField(fieldIndex, { required: checked })}
                      />
                      <span className="text-xs text-[var(--text-secondary)]">Obligatorio</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={field.visible}
                        onCheckedChange={(checked) => updateCustomField(fieldIndex, { visible: checked })}
                      />
                      <span className="text-xs text-[var(--text-secondary)]">Visible</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={field.editable}
                        onCheckedChange={(checked) => updateCustomField(fieldIndex, { editable: checked })}
                      />
                      <span className="text-xs text-[var(--text-secondary)]">Editable</span>
                    </div>
                  </div>

                  {field.type === 'select' && (
                    <div className="space-y-2">
                      <label className="text-xs text-[var(--text-secondary)]">Opciones</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nueva opción"
                          value={newOption}
                          onChange={(e) => setNewOption(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addFieldOption(fieldIndex)}
                        />
                        <Button size="sm" onClick={() => addFieldOption(fieldIndex)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(field.options || []).map((opt, optIndex) => (
                          <Badge key={optIndex} variant="outline" className="gap-1">
                            {opt}
                            <button onClick={() => removeFieldOption(fieldIndex, optIndex)} className="ml-1">×</button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs text-[var(--text-secondary)]">Valor por defecto</label>
                    <Input
                      placeholder="Valor por defecto (opcional)"
                      value={field.default_value || ''}
                      onChange={(e) => updateCustomField(fieldIndex, { default_value: e.target.value })}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forms" className="space-y-4">
          <TaskFormManager projectId={projectId} config={config} />
        </TabsContent>
      </Tabs>
    </div>
  );
}