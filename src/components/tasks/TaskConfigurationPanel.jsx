import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Settings, Bell, Shield, Eye, Plus, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const DEFAULT_CONFIG = {
  module_enabled: true,
  enabled_fields: {
    title: true,
    description: true,
    status: true,
    priority: true,
    due_date: true,
    assigned_to: false,
    comments: false,
    tags: false
  },
  required_fields: ['title'],
  field_order: ['title', 'description', 'status', 'priority', 'due_date', 'assigned_to', 'tags', 'comments'],
  custom_statuses: [
    { key: 'pending', label: 'Pendiente', color: 'gray' },
    { key: 'in_progress', label: 'En Progreso', color: 'blue' },
    { key: 'completed', label: 'Completado', color: 'green' }
  ],
  custom_priorities: [
    { key: 'low', label: 'Baja', color: 'gray' },
    { key: 'medium', label: 'Media', color: 'yellow' },
    { key: 'high', label: 'Alta', color: 'red' }
  ],
  custom_fields: [],
  enabled_views: {
    list: true,
    table: false,
    kanban: false
  },
  notifications: {
    enabled: false,
    events: {
      task_created: false,
      status_changed: false,
      assigned: false,
      comment_added: false,
      due_soon: false
    },
    recipients: {
      creator: true,
      assigned: true,
      project_members: false
    },
    channels: {
      in_app: true,
      email: false
    }
  },
  permissions: {
    web_leader: { can_create: true, can_edit: true, can_delete: true, can_change_status: true },
    developer: { can_create: true, can_edit: true, can_delete: false, can_change_status: true },
    qa: { can_create: true, can_edit: true, can_delete: false, can_change_status: true },
    product_owner: { can_create: true, can_edit: true, can_delete: true, can_change_status: true }
  }
};

const FIELD_LABELS = {
  title: 'Título',
  description: 'Descripción',
  status: 'Estado',
  priority: 'Prioridad',
  due_date: 'Fecha de vencimiento',
  assigned_to: 'Asignación de responsables',
  comments: 'Comentarios',
  tags: 'Etiquetas'
};

const COLOR_OPTIONS = [
  { key: 'gray', label: 'Gris', className: 'bg-gray-500' },
  { key: 'blue', label: 'Azul', className: 'bg-blue-500' },
  { key: 'green', label: 'Verde', className: 'bg-green-500' },
  { key: 'yellow', label: 'Amarillo', className: 'bg-yellow-500' },
  { key: 'red', label: 'Rojo', className: 'bg-red-500' },
  { key: 'purple', label: 'Púrpura', className: 'bg-purple-500' },
  { key: 'pink', label: 'Rosa', className: 'bg-pink-500' },
  { key: 'orange', label: 'Naranja', className: 'bg-orange-500' }
];

export default function TaskConfigurationPanel({ projectId = null }) {
  const [config, setConfig] = useState(null);
  const [newStatus, setNewStatus] = useState({ key: '', label: '', color: 'gray' });
  const [newPriority, setNewPriority] = useState({ key: '', label: '', color: 'gray' });
  const [newCustomField, setNewCustomField] = useState({ key: '', label: '', type: 'text', required: false, options: [] });
  const [newOption, setNewOption] = useState('');
  
  const queryClient = useQueryClient();
  
  const { data: configurations = [], isLoading } = useQuery({
    queryKey: projectId ? ['task-configuration', projectId] : ['task-configurations'],
    queryFn: async () => {
      if (projectId) {
        // Buscar configuración del proyecto específico
        const configs = await base44.entities.TaskConfiguration.filter({ project_id: projectId });
        return configs || [];
      } else {
        // Buscar configuración global (listar todas y filtrar las que no tienen project_id)
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
      const configData = { ...data, project_id: projectId || null };
      if (configurations && configurations.length > 0) {
        return base44.entities.TaskConfiguration.update(configurations[0].id, configData);
      } else {
        return base44.entities.TaskConfiguration.create(configData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectId ? ['task-configuration', projectId] : ['task-configurations'] });
      toast.success('Configuración guardada correctamente');
    }
  });
  
  const handleSave = () => {
    saveMutation.mutate(config);
  };
  
  const handleFieldToggle = (field) => {
    setConfig({
      ...config,
      enabled_fields: {
        ...config.enabled_fields,
        [field]: !config.enabled_fields[field]
      }
    });
  };
  
  const handleRequiredToggle = (field) => {
    const required = config.required_fields || [];
    if (required.includes(field)) {
      setConfig({
        ...config,
        required_fields: required.filter(f => f !== field)
      });
    } else {
      setConfig({
        ...config,
        required_fields: [...required, field]
      });
    }
  };
  
  const handleAddStatus = () => {
    if (!newStatus.key || !newStatus.label) {
      toast.error('Completa todos los campos');
      return;
    }
    
    setConfig({
      ...config,
      custom_statuses: [...(config.custom_statuses || []), newStatus]
    });
    setNewStatus({ key: '', label: '', color: 'gray' });
  };
  
  const handleRemoveStatus = (index) => {
    const statuses = [...(config?.custom_statuses || [])];
    statuses.splice(index, 1);
    setConfig({ ...config, custom_statuses: statuses });
  };
  
  const handleAddPriority = () => {
    if (!newPriority.key || !newPriority.label) {
      toast.error('Completa todos los campos');
      return;
    }
    
    setConfig({
      ...config,
      custom_priorities: [...(config.custom_priorities || []), newPriority]
    });
    setNewPriority({ key: '', label: '', color: 'gray' });
  };
  
  const handleRemovePriority = (index) => {
    const priorities = [...(config?.custom_priorities || [])];
    priorities.splice(index, 1);
    setConfig({ ...config, custom_priorities: priorities });
  };
  
  const handleAddCustomField = () => {
    if (!newCustomField.key || !newCustomField.label) {
      toast.error('Completa todos los campos');
      return;
    }
    
    setConfig({
      ...config,
      custom_fields: [...(config?.custom_fields || []), { ...newCustomField }]
    });
    setNewCustomField({ key: '', label: '', type: 'text', required: false, options: [] });
  };
  
  const handleRemoveCustomField = (index) => {
    const fields = [...(config?.custom_fields || [])];
    fields.splice(index, 1);
    setConfig({ ...config, custom_fields: fields });
  };
  
  const handleAddOption = (fieldIndex) => {
    if (!newOption.trim()) return;
    
    const fields = [...(config?.custom_fields || [])];
    if (!fields[fieldIndex].options) fields[fieldIndex].options = [];
    fields[fieldIndex].options.push(newOption);
    setConfig({ ...config, custom_fields: fields });
    setNewOption('');
  };
  
  const handleFieldReorder = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(config.field_order);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setConfig({ ...config, field_order: items });
  };
  
  if (isLoading || !config) {
    return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF1B7E]" />;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
            {projectId ? 'Configuración de Tareas del Proyecto' : 'Configuración Global de Tareas'}
          </h2>
          {projectId && (
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Personaliza el módulo de tareas para este proyecto
            </p>
          )}
        </div>
        <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-[#FF1B7E] hover:bg-[#e6156e] text-white">
          Guardar Configuración
        </Button>
      </div>
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-[var(--bg-secondary)] border-[var(--border-primary)]">
          <TabsTrigger value="general" className="data-[state=active]:bg-[#FF1B7E] data-[state=active]:text-white">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="fields" className="data-[state=active]:bg-[#FF1B7E] data-[state=active]:text-white">
            Campos
          </TabsTrigger>
          <TabsTrigger value="views" className="data-[state=active]:bg-[#FF1B7E] data-[state=active]:text-white">
            <Eye className="h-4 w-4 mr-2" />
            Vistas
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-[#FF1B7E] data-[state=active]:text-white">
            <Bell className="h-4 w-4 mr-2" />
            Notificaciones
          </TabsTrigger>
          <TabsTrigger value="permissions" className="data-[state=active]:bg-[#FF1B7E] data-[state=active]:text-white">
            <Shield className="h-4 w-4 mr-2" />
            Permisos
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-6 mt-6">
          <Card className="bg-[var(--bg-primary)] border-[var(--border-primary)]">
            <CardHeader>
              <CardTitle className="text-[var(--text-primary)]">Configuración General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-secondary)]">
                <div>
                  <Label className="text-[var(--text-primary)] font-semibold text-base">Módulo de Tareas Habilitado</Label>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Activa o desactiva el módulo de tareas para todos los proyectos
                  </p>
                </div>
                <Switch
                  checked={config.module_enabled}
                  onCheckedChange={(checked) => setConfig({ ...config, module_enabled: checked })}
                  className="data-[state=checked]:bg-[#FF1B7E]"
                />
              </div>
              
              {!config.module_enabled && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-sm text-amber-600">
                  <strong>⚠️ Atención:</strong> El módulo de tareas está deshabilitado. Los usuarios no podrán ver ni crear tareas en los proyectos.
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-[var(--bg-primary)] border-[var(--border-primary)]">
            <CardHeader>
              <CardTitle className="text-[var(--text-primary)]">Estados Personalizados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <Input
                  placeholder="Clave (ej: blocked)"
                  value={newStatus.key}
                  onChange={(e) => setNewStatus({ ...newStatus, key: e.target.value })}
                />
                <Input
                  placeholder="Etiqueta (ej: Bloqueado)"
                  value={newStatus.label}
                  onChange={(e) => setNewStatus({ ...newStatus, label: e.target.value })}
                />
                <select
                  value={newStatus.color}
                  onChange={(e) => setNewStatus({ ...newStatus, color: e.target.value })}
                  className="px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)]"
                >
                  {COLOR_OPTIONS.map(color => (
                    <option key={color.key} value={color.key}>{color.label}</option>
                  ))}
                </select>
                <Button onClick={handleAddStatus} size="sm" className="bg-white hover:bg-gray-100 text-black">
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </Button>
              </div>
              
              <div className="space-y-2">
                {(config.custom_statuses || []).map((status, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-secondary)]">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded ${COLOR_OPTIONS.find(c => c.key === status.color)?.className}`} />
                      <span className="text-[var(--text-primary)]">{status.label}</span>
                      <Badge variant="outline" className="text-xs">{status.key}</Badge>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveStatus(index)}
                      className="h-8 w-8 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[var(--bg-primary)] border-[var(--border-primary)]">
            <CardHeader>
              <CardTitle className="text-[var(--text-primary)]">Prioridades Personalizadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <Input
                  placeholder="Clave (ej: critical)"
                  value={newPriority.key}
                  onChange={(e) => setNewPriority({ ...newPriority, key: e.target.value })}
                />
                <Input
                  placeholder="Etiqueta (ej: Crítica)"
                  value={newPriority.label}
                  onChange={(e) => setNewPriority({ ...newPriority, label: e.target.value })}
                />
                <select
                  value={newPriority.color}
                  onChange={(e) => setNewPriority({ ...newPriority, color: e.target.value })}
                  className="px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)]"
                >
                  {COLOR_OPTIONS.map(color => (
                    <option key={color.key} value={color.key}>{color.label}</option>
                  ))}
                </select>
                <Button onClick={handleAddPriority} size="sm" className="bg-white hover:bg-gray-100 text-black">
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </Button>
              </div>
              
              <div className="space-y-2">
                {(config.custom_priorities || []).map((priority, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-secondary)]">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded ${COLOR_OPTIONS.find(c => c.key === priority.color)?.className}`} />
                      <span className="text-[var(--text-primary)]">{priority.label}</span>
                      <Badge variant="outline" className="text-xs">{priority.key}</Badge>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemovePriority(index)}
                      className="h-8 w-8 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="fields" className="space-y-6 mt-6">
          <Card className="bg-[var(--bg-primary)] border-[var(--border-primary)]">
            <CardHeader>
              <CardTitle className="text-[var(--text-primary)]">Campos Estándar</CardTitle>
            </CardHeader>
            <CardContent>
              <DragDropContext onDragEnd={handleFieldReorder}>
                <Droppable droppableId="fields">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                      {config.field_order.map((field, index) => (
                        <Draggable key={field} draggableId={field} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-secondary)]"
                            >
                              <div className="flex items-center gap-3">
                                <div {...provided.dragHandleProps}>
                                  <GripVertical className="h-5 w-5 text-[var(--text-tertiary)] cursor-move" />
                                </div>
                                <span className="text-[var(--text-primary)] font-medium">{FIELD_LABELS[field]}</span>
                                {field === 'title' && (
                                  <Badge variant="outline" className="text-xs">Obligatorio</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4">
                                {field !== 'title' && (
                                  <div className="flex items-center gap-2">
                                    <Label className="text-sm text-[var(--text-secondary)]">Obligatorio</Label>
                                    <Switch
                                      checked={config.required_fields?.includes(field)}
                                      onCheckedChange={() => handleRequiredToggle(field)}
                                      disabled={!config.enabled_fields[field]}
                                    />
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <Label className="text-sm text-[var(--text-secondary)]">Habilitado</Label>
                                  <Switch
                                    checked={config.enabled_fields[field]}
                                    onCheckedChange={() => handleFieldToggle(field)}
                                    disabled={field === 'title'}
                                  />
                                </div>
                              </div>
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
          
          <Card className="bg-[var(--bg-primary)] border-[var(--border-primary)]">
            <CardHeader>
              <CardTitle className="text-[var(--text-primary)]">Campos Personalizados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-5 gap-3">
                <Input
                  placeholder="Clave (ej: budget)"
                  value={newCustomField.key}
                  onChange={(e) => setNewCustomField({ ...newCustomField, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                />
                <Input
                  placeholder="Etiqueta (ej: Presupuesto)"
                  value={newCustomField.label}
                  onChange={(e) => setNewCustomField({ ...newCustomField, label: e.target.value })}
                />
                <select
                  value={newCustomField.type}
                  onChange={(e) => setNewCustomField({ ...newCustomField, type: e.target.value, options: [] })}
                  className="px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)]"
                >
                  <option value="text">Texto</option>
                  <option value="number">Número</option>
                  <option value="date">Fecha</option>
                  <option value="select">Selección</option>
                  <option value="multiselect">Multi-selección</option>
                </select>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-[var(--text-secondary)]">Obligatorio</Label>
                  <Switch
                    checked={newCustomField.required}
                    onCheckedChange={(checked) => setNewCustomField({ ...newCustomField, required: checked })}
                  />
                </div>
                <Button onClick={handleAddCustomField} size="sm" className="bg-white hover:bg-gray-100 text-black">
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </Button>
              </div>
              
              <div className="space-y-3">
                {(config.custom_fields || []).map((field, index) => (
                  <div key={index} className="p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-secondary)] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-[var(--text-primary)] font-medium">{field.label}</span>
                        <Badge variant="outline" className="text-xs">{field.key}</Badge>
                        <Badge variant="outline" className="text-xs">{field.type}</Badge>
                        {field.required && <Badge className="bg-red-500 text-white text-xs">Obligatorio</Badge>}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveCustomField(index)}
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {(field.type === 'select' || field.type === 'multiselect') && (
                      <div className="pl-4 space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Nueva opción"
                            value={index === (config?.custom_fields?.length ?? 0) - 1 ? newOption : ''}
                            onChange={(e) => setNewOption(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleAddOption(index);
                              }
                            }}
                            className="flex-1"
                          />
                          <Button size="sm" onClick={() => handleAddOption(index)} className="bg-white hover:bg-gray-100 text-black">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(field.options || []).map((option, optIndex) => (
                            <Badge key={optIndex} variant="outline" className="text-xs">
                              {option}
                              <button
                                onClick={() => {
                                  const fields = [...config.custom_fields];
                                  fields[index].options.splice(optIndex, 1);
                                  setConfig({ ...config, custom_fields: fields });
                                }}
                                className="ml-1 text-red-500 hover:text-red-700"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="views" className="space-y-6 mt-6">
          <Card className="bg-[var(--bg-primary)] border-[var(--border-primary)]">
            <CardHeader>
              <CardTitle className="text-[var(--text-primary)]">Vistas Disponibles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-[var(--text-primary)]">Vista de Lista</Label>
                  <p className="text-sm text-[var(--text-secondary)]">Listado simple de tareas</p>
                </div>
                <Switch
                  checked={config.enabled_views?.list}
                  onCheckedChange={(checked) => setConfig({
                    ...config,
                    enabled_views: { ...config.enabled_views, list: checked }
                  })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-[var(--text-primary)]">Vista de Tabla</Label>
                  <p className="text-sm text-[var(--text-secondary)]">Tabla con todas las columnas</p>
                </div>
                <Switch
                  checked={config.enabled_views?.table}
                  onCheckedChange={(checked) => setConfig({
                    ...config,
                    enabled_views: { ...config.enabled_views, table: checked }
                  })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-[var(--text-primary)]">Vista Kanban</Label>
                  <p className="text-sm text-[var(--text-secondary)]">Tablero por estado</p>
                </div>
                <Switch
                  checked={config.enabled_views?.kanban}
                  onCheckedChange={(checked) => setConfig({
                    ...config,
                    enabled_views: { ...config.enabled_views, kanban: checked }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-6 mt-6">
          <Card className="bg-[var(--bg-primary)] border-[var(--border-primary)]">
            <CardHeader>
              <CardTitle className="text-[var(--text-primary)]">Sistema de Notificaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label className="text-[var(--text-primary)]">Notificaciones Habilitadas</Label>
                <Switch
                  checked={config.notifications?.enabled}
                  onCheckedChange={(checked) => setConfig({
                    ...config,
                    notifications: { ...config.notifications, enabled: checked }
                  })}
                />
              </div>
              
              {config.notifications?.enabled && (
                <>
                  <div className="space-y-3">
                    <h4 className="font-medium text-[var(--text-primary)]">Eventos</h4>
                    {Object.entries({
                      task_created: 'Creación de tarea',
                      status_changed: 'Cambio de estado',
                      assigned: 'Asignación de responsable',
                      comment_added: 'Comentario nuevo',
                      due_soon: 'Tarea próxima a vencer'
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between">
                        <Label className="text-[var(--text-secondary)]">{label}</Label>
                        <Switch
                          checked={config.notifications?.events?.[key]}
                          onCheckedChange={(checked) => setConfig({
                            ...config,
                            notifications: {
                              ...config.notifications,
                              events: { ...config.notifications.events, [key]: checked }
                            }
                          })}
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium text-[var(--text-primary)]">Destinatarios</h4>
                    {Object.entries({
                      creator: 'Creador de la tarea',
                      assigned: 'Responsables asignados',
                      project_members: 'Miembros del proyecto'
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between">
                        <Label className="text-[var(--text-secondary)]">{label}</Label>
                        <Switch
                          checked={config.notifications?.recipients?.[key]}
                          onCheckedChange={(checked) => setConfig({
                            ...config,
                            notifications: {
                              ...config.notifications,
                              recipients: { ...config.notifications.recipients, [key]: checked }
                            }
                          })}
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium text-[var(--text-primary)]">Canales</h4>
                    <div className="flex items-center justify-between">
                      <Label className="text-[var(--text-secondary)]">In-app (Obligatorio)</Label>
                      <Switch checked={true} disabled />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-[var(--text-secondary)]">Email</Label>
                      <Switch
                        checked={config.notifications?.channels?.email}
                        onCheckedChange={(checked) => setConfig({
                          ...config,
                          notifications: {
                            ...config.notifications,
                            channels: { ...config.notifications.channels, email: checked }
                          }
                        })}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="permissions" className="space-y-6 mt-6">
          <Card className="bg-[var(--bg-primary)] border-[var(--border-primary)]">
            <CardHeader>
              <CardTitle className="text-[var(--text-primary)]">Permisos por Rol</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries({
                web_leader: 'Líder Web',
                developer: 'Desarrollador',
                qa: 'QA',
                product_owner: 'Product Owner'
              }).map(([role, label]) => (
                <div key={role} className="space-y-3">
                  <h4 className="font-medium text-[var(--text-primary)]">{label}</h4>
                  <div className="grid grid-cols-2 gap-4 pl-4">
                    {Object.entries({
                      can_create: 'Crear tareas',
                      can_edit: 'Editar tareas',
                      can_delete: 'Eliminar tareas',
                      can_change_status: 'Modificar estados'
                    }).map(([perm, permLabel]) => (
                      <div key={perm} className="flex items-center justify-between">
                        <Label className="text-[var(--text-secondary)]">{permLabel}</Label>
                        <Switch
                          checked={config.permissions?.[role]?.[perm]}
                          onCheckedChange={(checked) => setConfig({
                            ...config,
                            permissions: {
                              ...config.permissions,
                              [role]: { ...config.permissions[role], [perm]: checked }
                            }
                          })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}