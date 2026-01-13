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
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const queryClient = useQueryClient();

  // Validar que siempre haya projectId
  if (!projectId) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--text-secondary)]">Error: Se requiere un ID de proyecto</p>
      </div>
    );
  }

  const { data: configurations = [], isLoading, error } = useQuery({
    queryKey: ['task-configuration', projectId],
    queryFn: async () => {
      console.log('📥 [CONFIG PANEL] Cargando configuraciones para proyecto:', projectId);
      
      const configs = await base44.entities.TaskConfiguration.filter({ project_id: projectId });
      console.log('📦 [CONFIG PANEL] Configs encontradas:', configs?.length);
      
      // Si no hay configuración, crearla inmediatamente
      if (!configs || configs.length === 0) {
        console.log('⚙️ [CONFIG PANEL] Creando configuración automáticamente...');
        const newConfig = await base44.entities.TaskConfiguration.create({
          ...DEFAULT_CONFIG,
          project_id: projectId
        });
        console.log('✅ [CONFIG PANEL] Configuración creada:', newConfig);
        
        // Invalidar cache para que otras queries vean la nueva config
        queryClient.invalidateQueries({ queryKey: ['task-configuration', projectId] });
        
        toast.success('✅ Configuración creada automáticamente');
        return [newConfig];
      }
      
      return configs;
    },
    staleTime: 0,
    refetchOnMount: 'always',
    retry: 1
  });

  React.useEffect(() => {
    console.log('🔄 Actualizando config local con:', configurations);
    if (configurations && configurations.length > 0) {
      setConfig(configurations[0]);
      setHasUnsavedChanges(false);
    }
  }, [configurations]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      console.log('💾 [BACKEND] Iniciando guardado:', { projectId, hasExisting: configurations?.length > 0 });
      
      const configData = { 
        module_enabled: data.module_enabled ?? true,
        custom_statuses: data.custom_statuses || [],
        custom_priorities: data.custom_priorities || [],
        custom_fields: data.custom_fields || [],
        project_id: projectId
      };
      
      console.log('📦 [BACKEND] Datos a guardar:', configData);
      
      let result;
      
      // CASO 1: Actualizar configuración existente
      if (configurations && configurations.length > 0) {
        console.log('✏️ [BACKEND] Actualizando config existente, ID:', configurations[0].id);
        result = await base44.entities.TaskConfiguration.update(configurations[0].id, configData);
        console.log('✅ [BACKEND] Config actualizada:', result);
      } 
      // CASO 2: Crear nueva configuración
      else {
        console.log('➕ [BACKEND] Creando nueva config');
        result = await base44.entities.TaskConfiguration.create(configData);
        console.log('✅ [BACKEND] Config creada:', result);
      }
      
      return { savedConfig: result };
    },
    onSuccess: async ({ savedConfig }) => {
      console.log('✅ [FRONTEND] Configuración guardada:', savedConfig);
      
      // 1. Actualizar estado local inmediatamente
      setConfig(savedConfig);
      setHasUnsavedChanges(false);
      
      // 2. Actualizar cache específico del proyecto
      queryClient.setQueryData(['task-configuration', projectId], [savedConfig]);
      console.log('📦 [FRONTEND] Cache actualizado para proyecto:', projectId);
      
      // 3. Invalidar queries de configuración y tareas del proyecto
      await queryClient.invalidateQueries({ queryKey: ['task-configuration', projectId] });
      await queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      console.log('🔄 [FRONTEND] Queries invalidadas para proyecto:', projectId);
    },
    onError: (error) => {
      console.error('❌ [BACKEND] Error guardando:', error);
      console.error('❌ [BACKEND] Stack:', error.stack);
      throw error;
    }
  });

  const handleSave = async () => {
    console.log('🔘 [FRONTEND] Iniciando proceso de guardado...');
    
    // Validaciones
    const hasFinalStatus = config.custom_statuses?.some(s => s.is_final);
    if (!hasFinalStatus) {
      toast.error('⚠️ Debe haber al menos un estado marcado como final');
      return;
    }

    if (!config.custom_statuses || config.custom_statuses.length === 0) {
      toast.error('⚠️ Debe haber al menos un estado');
      return;
    }
    
    if (!config.custom_priorities || config.custom_priorities.length === 0) {
      toast.error('⚠️ Debe haber al menos una prioridad');
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading('💾 Guardando configuración del proyecto...');
    
    try {
      await saveMutation.mutateAsync(config);
      toast.success('✅ Configuración guardada', { id: toastId, duration: 3000 });
      console.log('✅ [FRONTEND] Guardado completado exitosamente');
    } catch (error) {
      console.error('❌ [FRONTEND] Error en handleSave:', error);
      toast.error(`❌ Error: ${error.message || 'Intenta de nuevo'}`, { id: toastId, duration: 4000 });
    } finally {
      setIsSaving(false);
    }
  };

  // Marcar cambios sin guardar cuando se modifica config
  const updateConfig = (newConfig) => {
    setConfig(newConfig);
    setHasUnsavedChanges(true);
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
    updateConfig({ ...config, custom_statuses: newStatuses });
  };

  const updateStatus = (index, updates) => {
    const newStatuses = [...config.custom_statuses];
    newStatuses[index] = { ...newStatuses[index], ...updates };
    updateConfig({ ...config, custom_statuses: newStatuses });
  };

  const deleteStatus = (index) => {
    if (config.custom_statuses.length <= 1) {
      toast.error('Debe haber al menos un estado');
      return;
    }
    const newStatuses = config.custom_statuses.filter((_, i) => i !== index);
    updateConfig({ ...config, custom_statuses: newStatuses });
  };

  const handleStatusReorder = (result) => {
    if (!result.destination) return;
    const items = Array.from(config.custom_statuses);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    const reorderedItems = items.map((item, index) => ({ ...item, order: index }));
    updateConfig({ ...config, custom_statuses: reorderedItems });
  };

  const addPriority = () => {
    const newPriorities = [...(config.custom_priorities || [])];
    newPriorities.push({
      key: `priority_${Date.now()}`,
      label: 'Nueva Prioridad',
      color: 'gray',
      order: newPriorities.length
    });
    updateConfig({ ...config, custom_priorities: newPriorities });
  };

  const updatePriority = (index, updates) => {
    const newPriorities = [...config.custom_priorities];
    newPriorities[index] = { ...newPriorities[index], ...updates };
    updateConfig({ ...config, custom_priorities: newPriorities });
  };

  const deletePriority = (index) => {
    if (config.custom_priorities.length <= 1) {
      toast.error('Debe haber al menos una prioridad');
      return;
    }
    const newPriorities = config.custom_priorities.filter((_, i) => i !== index);
    updateConfig({ ...config, custom_priorities: newPriorities });
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
    updateConfig({ ...config, custom_fields: newFields });
  };

  const updateCustomField = (index, updates) => {
    const newFields = [...config.custom_fields];
    newFields[index] = { ...newFields[index], ...updates };
    updateConfig({ ...config, custom_fields: newFields });
  };

  const deleteCustomField = (index) => {
    const newFields = config.custom_fields.filter((_, i) => i !== index);
    updateConfig({ ...config, custom_fields: newFields });
  };

  const addFieldOption = (fieldIndex) => {
    if (!newOption.trim()) return;
    const newFields = [...config.custom_fields];
    const field = newFields[fieldIndex];
    field.options = [...(field.options || []), newOption.trim()];
    updateConfig({ ...config, custom_fields: newFields });
    setNewOption('');
  };

  const removeFieldOption = (fieldIndex, optIndex) => {
    const newFields = [...config.custom_fields];
    const field = newFields[fieldIndex];
    field.options = field.options.filter((_, i) => i !== optIndex);
    updateConfig({ ...config, custom_fields: newFields });
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF1B7E] mx-auto" />
        <p className="text-sm text-[var(--text-secondary)] mt-4">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-[var(--text-primary)]">
                Configuración de Tareas
              </CardTitle>
              {hasUnsavedChanges && <Badge variant="outline" className="text-orange-500">Cambios sin guardar</Badge>}
              {isSaving && <Badge variant="outline" className="text-blue-500">Guardando...</Badge>}
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleSave} 
                disabled={isSaving} 
                className="bg-[#FF1B7E] hover:bg-[#e6156e] disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Guardando...' : 'Guardar Configuración'}
              </Button>
              <Switch
                checked={config.module_enabled}
                onCheckedChange={(checked) => updateConfig({ ...config, module_enabled: checked })}
                disabled={isSaving}
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