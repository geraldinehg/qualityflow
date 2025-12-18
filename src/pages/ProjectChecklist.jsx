import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Download, RefreshCw, Send, AlertTriangle, CheckCircle2, 
  ChevronDown, Settings, Users, Calendar, GripVertical 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import PhaseCard from '../components/checklist/PhaseCard';
import RiskSummary from '../components/checklist/RiskSummary';
import RoleSelector from '../components/team/RoleSelector';
import ConflictAlert from '../components/conflicts/ConflictAlert';
import EditChecklistItemModal from '../components/checklist/EditChecklistItemModal';
import AddChecklistItemModal from '../components/checklist/AddChecklistItemModal';
import EditProjectModal from '../components/project/EditProjectModal';
import EditPhaseModal from '../components/checklist/EditPhaseModal';
import { 
  PHASES, 
  SITE_TYPE_CONFIG, 
  TECHNOLOGY_CONFIG,
  generateFilteredChecklist,
  calculateProjectRisk
} from '../components/checklist/checklistTemplates';

export default function ProjectChecklist() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');
  
  const [expandedPhases, setExpandedPhases] = useState(['documentation']);
  const [userRole, setUserRole] = useState(() => localStorage.getItem('userRole') || '');
  const [user, setUser] = useState(null);
  const [viewMode, setViewMode] = useState('all');
  const [editingItem, setEditingItem] = useState(null);
  const [addingToPhase, setAddingToPhase] = useState(null);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editingPhase, setEditingPhase] = useState(null);
  const [phaseOrder, setPhaseOrder] = useState(() => 
    Object.keys(PHASES).sort((a, b) => PHASES[a].order - PHASES[b].order)
  );
  
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);
  
  useEffect(() => {
    if (userRole) {
      localStorage.setItem('userRole', userRole);
    }
  }, [userRole]);
  
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => base44.entities.Project.filter({ id: projectId }).then(r => r[0]),
    enabled: !!projectId
  });
  
  const { data: checklistItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['checklist-items', projectId],
    queryFn: () => base44.entities.ChecklistItem.filter({ project_id: projectId }),
    enabled: !!projectId
  });
  
  const { data: conflicts = [] } = useQuery({
    queryKey: ['conflicts', projectId],
    queryFn: () => base44.entities.Conflict.filter({ project_id: projectId, status: 'open' }),
    enabled: !!projectId
  });
  
  // Generar checklist inicial si no existe
  const [hasInitialized, setHasInitialized] = useState(false);
  
  const initializeChecklistMutation = useMutation({
    mutationFn: async () => {
      const template = generateFilteredChecklist(project.site_type, project.technology);
      const items = template.map(item => ({
        project_id: projectId,
        phase: item.phase,
        title: item.title,
        weight: item.weight,
        order: item.order,
        status: 'pending',
        applicable_technologies: item.technologies,
        applicable_site_types: item.siteTypes
      }));
      
      return await base44.entities.ChecklistItem.bulkCreate(items);
    },
    onSuccess: () => {
      setHasInitialized(true);
      queryClient.invalidateQueries({ queryKey: ['checklist-items', projectId] });
    }
  });
  
  useEffect(() => {
    if (project && checklistItems.length === 0 && !itemsLoading && !hasInitialized && !initializeChecklistMutation.isPending) {
      initializeChecklistMutation.mutate();
    }
  }, [project, checklistItems.length, itemsLoading, hasInitialized]);
  
  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, data }) => {
      const updateData = { ...data };
      if (data.status === 'completed') {
        updateData.completed_by = user?.email;
        updateData.completed_by_role = userRole;
      }
      await base44.entities.ChecklistItem.update(itemId, updateData);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['checklist-items', projectId] });
      // Solo mostrar toast si no es una actualización de estado de completado
      if (!variables.data.status) {
        toast.success('Ítem actualizado correctamente');
      }
    }
  });
  
  const deleteItemMutation = useMutation({
    mutationFn: (itemId) => base44.entities.ChecklistItem.delete(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-items', projectId] });
      setEditingItem(null);
      toast.success('Ítem eliminado correctamente');
    }
  });
  
  const createItemMutation = useMutation({
    mutationFn: (data) => base44.entities.ChecklistItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-items', projectId] });
      setAddingToPhase(null);
      toast.success('Ítem agregado correctamente');
    }
  });
  
  const updateProjectMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.update(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsEditingProject(false);
      toast.success('Proyecto actualizado correctamente');
    }
  });
  
  const resolveConflictMutation = useMutation({
    mutationFn: async ({ conflictId, resolution }) => {
      await base44.entities.Conflict.update(conflictId, {
        status: 'resolved',
        resolution,
        resolved_by: user?.email,
        resolved_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conflicts', projectId] });
    }
  });
  
  // Calcular riesgo
  const risk = useMemo(() => {
    if (checklistItems.length === 0) return null;
    return calculateProjectRisk(checklistItems, project);
  }, [checklistItems, project]);
  
  // Actualizar proyecto con métricas
  useEffect(() => {
    if (risk && project) {
      const criticalPending = checklistItems.filter(i => i.weight === 'critical' && i.status !== 'completed').length;
      const completed = checklistItems.filter(i => i.status === 'completed').length;
      const total = checklistItems.length;
      const completionPercentage = total > 0 ? (completed / total) * 100 : 0;
      
      if (project.completion_percentage !== completionPercentage || 
          project.critical_pending !== criticalPending ||
          project.risk_level !== risk.level) {
        updateProjectMutation.mutate({
          completion_percentage: completionPercentage,
          critical_pending: criticalPending,
          risk_level: risk.level,
          has_conflicts: conflicts.length > 0
        });
      }
    }
  }, [risk, checklistItems, conflicts]);
  
  // Agrupar items por fase
  const itemsByPhase = useMemo(() => {
    const grouped = {};
    Object.keys(PHASES).forEach(phase => {
      grouped[phase] = checklistItems.filter(item => item.phase === phase);
    });
    return grouped;
  }, [checklistItems]);
  
  // Filtrar por vista
  const filteredItemsByPhase = useMemo(() => {
    if (viewMode === 'all') return itemsByPhase;
    
    const filtered = {};
    Object.keys(itemsByPhase).forEach(phase => {
      if (viewMode === 'pending') {
        filtered[phase] = itemsByPhase[phase].filter(i => i.status === 'pending');
      } else if (viewMode === 'critical') {
        filtered[phase] = itemsByPhase[phase].filter(i => i.weight === 'critical');
      } else {
        filtered[phase] = itemsByPhase[phase];
      }
    });
    return filtered;
  }, [itemsByPhase, viewMode]);
  
  const criticalPhases = project?.site_type ? SITE_TYPE_CONFIG[project.site_type]?.criticalPhases || [] : [];
  
  const handleItemUpdate = (itemId, data) => {
    updateItemMutation.mutate({ itemId, data });
  };
  
  const handleItemEdit = (item) => {
    setEditingItem(item);
  };
  
  const handleSaveEdit = (data) => {
    if (editingItem) {
      updateItemMutation.mutate({ 
        itemId: editingItem.id, 
        data 
      }, {
        onSuccess: () => {
          setEditingItem(null);
        }
      });
    }
  };
  
  const handleDeleteItem = (itemId) => {
    deleteItemMutation.mutate(itemId);
  };
  
  const handleAddItem = (phase) => {
    setAddingToPhase(phase);
  };
  
  const handleCreateItem = (data) => {
    createItemMutation.mutate(data);
  };
  
  const handleSaveProject = (data) => {
    updateProjectMutation.mutate(data);
  };
  
  const handleEditPhase = (phase) => {
    setEditingPhase(phase);
  };
  
  const handleSavePhase = (phase, newName) => {
    const customNames = { ...(project.custom_phase_names || {}) };
    customNames[phase] = newName;
    updateProjectMutation.mutate({ custom_phase_names: customNames });
    setEditingPhase(null);
  };
  
  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    
    const { source, destination, type } = result;
    
    if (type === 'PHASE') {
      // Reordenar fases
      const newPhaseOrder = Array.from(phaseOrder);
      const [removed] = newPhaseOrder.splice(source.index, 1);
      newPhaseOrder.splice(destination.index, 0, removed);
      setPhaseOrder(newPhaseOrder);
      
      // Guardar en el proyecto
      updateProjectMutation.mutate({ phase_order: newPhaseOrder });
    } else if (type === 'ITEM') {
      // Reordenar ítems dentro de una fase
      const phase = source.droppableId;
      const items = [...(itemsByPhase[phase] || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
      const [movedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, movedItem);
      
      // Actualizar el orden de todos los ítems
      const updates = items.map((item, index) => ({
        id: item.id,
        order: index + 1
      }));
      
      // Actualizar en la base de datos
      for (const update of updates) {
        await base44.entities.ChecklistItem.update(update.id, { order: update.order });
      }
      
      queryClient.invalidateQueries({ queryKey: ['checklist-items', projectId] });
    }
  };
  
  const togglePhase = (phase) => {
    setExpandedPhases(prev => 
      prev.includes(phase) 
        ? prev.filter(p => p !== phase)
        : [...prev, phase]
    );
  };
  
  const expandAll = () => setExpandedPhases(Object.keys(PHASES));
  const collapseAll = () => setExpandedPhases([]);
  
  // Cargar orden de fases guardado
  useEffect(() => {
    if (project?.phase_order) {
      setPhaseOrder(project.phase_order);
    }
  }, [project]);
  
  if (projectLoading || !project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-sm text-slate-600">Cargando proyecto...</p>
        </div>
      </div>
    );
  }
  
  const siteTypeConfig = SITE_TYPE_CONFIG[project.site_type];
  const techConfig = TECHNOLOGY_CONFIG[project.technology];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-start gap-4">
              <Link to={createPageUrl('Dashboard')}>
                <Button variant="ghost" size="icon" className="mt-1">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${techConfig?.color || 'bg-slate-400'}`} />
                  <span className="text-xs text-slate-500 uppercase tracking-wide">
                    {techConfig?.name} • {siteTypeConfig?.name}
                  </span>
                </div>
                <h1 className="text-xl font-bold text-slate-900">{project.name}</h1>
                {project.target_date && (
                  <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                    <Calendar className="h-4 w-4" />
                    <span>Entrega: {format(new Date(project.target_date), "d MMMM yyyy", { locale: es })}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <RoleSelector value={userRole} onChange={setUserRole} showLabel={false} />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditingProject(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Editar Proyecto
              </Button>
              <Button variant="outline" size="sm" onClick={expandAll}>
                Expandir todo
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                Colapsar todo
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checklist */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filtros de vista */}
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <Tabs value={viewMode} onValueChange={setViewMode}>
                <TabsList>
                  <TabsTrigger value="all">
                    Todos los ítems
                  </TabsTrigger>
                  <TabsTrigger value="pending">
                    Solo pendientes
                  </TabsTrigger>
                  <TabsTrigger value="critical">
                    Solo críticos
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {/* Conflictos */}
            {conflicts.length > 0 && (
              <div className="space-y-2">
                {conflicts.map(conflict => (
                  <ConflictAlert 
                    key={conflict.id} 
                    conflict={conflict}
                    isLeader={userRole === 'web_leader'}
                    onResolve={(id, status, resolution) => 
                      resolveConflictMutation.mutate({ conflictId: id, resolution })
                    }
                  />
                ))}
              </div>
            )}
            
            {/* Fases del checklist */}
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="phases" type="PHASE">
                {(provided) => (
                  <div 
                    {...provided.droppableProps} 
                    ref={provided.innerRef}
                    className="space-y-4"
                  >
                    {phaseOrder.map((phaseKey, index) => {
                     const allItems = itemsByPhase[phaseKey] || [];

                     return (
                       <Draggable key={phaseKey} draggableId={phaseKey} index={index}>
                         {(provided, snapshot) => (
                           <div
                             ref={provided.innerRef}
                             {...provided.draggableProps}
                             className={snapshot.isDragging ? 'opacity-50' : ''}
                           >
                             <PhaseCard
                               phase={phaseKey}
                               items={allItems}
                               isExpanded={expandedPhases.includes(phaseKey)}
                               onToggle={() => togglePhase(phaseKey)}
                               onItemUpdate={handleItemUpdate}
                               onItemEdit={handleItemEdit}
                               onAddItem={handleAddItem}
                               onEditPhase={handleEditPhase}
                               userRole={userRole}
                               isCriticalPhase={criticalPhases.includes(phaseKey)}
                               customPhaseName={project?.custom_phase_names?.[phaseKey]}
                               dragHandleProps={provided.dragHandleProps}
                             />
                           </div>
                         )}
                       </Draggable>
                     );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
          
          {/* Panel lateral - Resumen */}
          <div className="space-y-6">
            {risk && <RiskSummary risk={risk} project={project} />}
            
            {/* Fases críticas */}
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Fases críticas para este proyecto
              </h3>
              <div className="space-y-2">
                {criticalPhases.map(phase => {
                  const items = itemsByPhase[phase] || [];
                  const completed = items.filter(i => i.status === 'completed').length;
                  const progress = items.length > 0 ? (completed / items.length) * 100 : 0;
                  
                  return (
                    <div key={phase} className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-700">
                          {PHASES[phase]?.name}
                        </p>
                        <Progress value={progress} className="h-1.5 mt-1" />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {completed}/{items.length}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Acciones */}
            <div className="bg-white rounded-xl p-4 shadow-sm border space-y-3">
              <Button 
                className="w-full" 
                disabled={!risk?.canDeliver}
                variant={risk?.canDeliver ? 'default' : 'secondary'}
              >
                <Send className="h-4 w-4 mr-2" />
                {risk?.canDeliver ? 'Marcar como Entregado' : 'Entrega Bloqueada'}
              </Button>
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Exportar Reporte
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      {/* Modales */}
      <EditChecklistItemModal
        item={editingItem}
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleSaveEdit}
        onDelete={handleDeleteItem}
        isLoading={updateItemMutation.isPending || deleteItemMutation.isPending}
      />
      
      <AddChecklistItemModal
        phase={addingToPhase}
        projectId={projectId}
        isOpen={!!addingToPhase}
        onClose={() => setAddingToPhase(null)}
        onCreate={handleCreateItem}
        isLoading={createItemMutation.isPending}
      />
      
      <EditProjectModal
        project={project}
        isOpen={isEditingProject}
        onClose={() => setIsEditingProject(false)}
        onSave={handleSaveProject}
        isLoading={updateProjectMutation.isPending}
      />
      
      <EditPhaseModal
        phase={editingPhase}
        currentName={project?.custom_phase_names?.[editingPhase]}
        isOpen={!!editingPhase}
        onClose={() => setEditingPhase(null)}
        onSave={handleSavePhase}
        isLoading={updateProjectMutation.isPending}
      />
    </div>
  );
}