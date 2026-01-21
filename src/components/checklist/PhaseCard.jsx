import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ChevronDown, ChevronRight, FileText, GitBranch, Palette, Code, Zap, Search,
  Smartphone, CheckSquare, Shield, Rocket, Plus, Edit2, GripVertical,
  CheckCircle2, Circle, AlertTriangle } from
'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import ChecklistItemRow from './ChecklistItemRow';
import PhaseApprovalModal from '../workflow/PhaseApprovalModal';
import EntryCriteriaModal from '../workflow/EntryCriteriaModal';
import { DEFAULT_ENTRY_CRITERIA } from '../workflow/entryCriteriaTemplates';
import { PHASES } from './checklistTemplates';

const iconMap = {
  FileText, GitBranch, Palette, Code, Zap, Search, Smartphone, CheckSquare, Shield, Rocket
};

const WORKFLOW_CONFIG = {
  activation: { hasEntryCriteria: true, approver: 'leader_product', approverLabel: 'Líder Producto' },
  planning: { hasEntryCriteria: true, approver: 'product_owner', approverLabel: 'Product Owner' },
  design: { hasEntryCriteria: true, approver: 'leader_creativity', approverLabel: 'Líder de Creatividad' },
  web_development: { hasEntryCriteria: true, approver: 'web_leader', approverLabel: 'Líder Web' },
  development: { hasEntryCriteria: true, approver: ['leader_software', 'qa'], approverLabel: 'DEV / QA' },
  qa_complete: { hasEntryCriteria: false, approver: 'qa', approverLabel: 'QA' },
  content_upload: { hasEntryCriteria: false, approver: ['leader_software', 'product_owner'], approverLabel: 'DEV / Producto' },
  final_approval: { hasEntryCriteria: true, approver: 'web_leader', approverLabel: 'Líder Web' },
  stabilization: { hasEntryCriteria: false, approver: 'qa', approverLabel: 'QA' }
};

export default function PhaseCard({
  phase,
  items,
  isExpanded,
  onToggle,
  onItemUpdate,
  onItemEdit,
  onAddItem,
  onEditPhase,
  onItemReorder,
  userRole,
  isCriticalPhase,
  customPhaseName,
  dragHandleProps,
  isDragging,
  project
}) {
  const [approvingPhase, setApprovingPhase] = useState(false);
  const [showEntryCriteria, setShowEntryCriteria] = useState(false);

  const queryClient = useQueryClient();
  const phaseConfig = PHASES[phase];
  const Icon = iconMap[phaseConfig?.icon] || FileText;
  const displayName = customPhaseName || phaseConfig?.name || phase;

  const completed = items.filter((i) => i.status === 'completed').length;
  const total = items.length;
  const progress = total > 0 ? completed / total * 100 : 0;
  const hasCritical = items.some((i) => i.weight === 'critical' && i.status !== 'completed');
  const hasConflicts = items.some((i) => i.status === 'conflict');

  // Workflow data
  const { data: workflowPhases = [] } = useQuery({
    queryKey: ['workflow-phases', project?.id],
    queryFn: () => base44.entities.WorkflowPhase.filter({ project_id: project.id }),
    enabled: !!project?.id
  });

  const { data: entryCriteria = [] } = useQuery({
    queryKey: ['entry-criteria', project?.id],
    queryFn: () => base44.entities.EntryCriteria.filter({ project_id: project.id }),
    enabled: !!project?.id
  });

  const updateProjectMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.update(project.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', project.id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });

  const updatePhaseMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WorkflowPhase.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-phases', project.id] });
    }
  });

  const createPhaseMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkflowPhase.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-phases', project.id] });
    }
  });

  const workflowConfig = WORKFLOW_CONFIG[phase];
  const phaseData = workflowPhases.find((p) => p.phase_key === phase);
  const isWorkflowCompleted = phaseData?.status === 'completed';
  const isWorkflowInProgress = phaseData?.status === 'in_progress';
  const phaseCriteria = entryCriteria.filter((c) => c.phase_key === phase);
  const mandatoryCriteria = phaseCriteria.filter((c) => c.is_mandatory);
  const completedMandatory = mandatoryCriteria.filter((c) => c.is_completed);

  const canUserApprove = () => {
    if (!workflowConfig) return false;
    if (Array.isArray(workflowConfig.approver)) {
      return workflowConfig.approver.includes(userRole);
    }
    return workflowConfig.approver === userRole;
  };

  const handleStartWorkflow = async () => {
    const existingPhase = phaseData;
    if (existingPhase) {
      await updatePhaseMutation.mutateAsync({
        id: existingPhase.id,
        data: { status: 'in_progress', started_at: new Date().toISOString() }
      });
    } else {
      await createPhaseMutation.mutateAsync({
        project_id: project.id,
        phase_key: phase,
        status: 'in_progress',
        started_at: new Date().toISOString()
      });
    }

    // Crear criterios de entrada predefinidos si la fase los tiene
    const existingCriteria = phaseCriteria;
    if (existingCriteria.length === 0 && DEFAULT_ENTRY_CRITERIA[phase]) {
      const criteriaToCreate = DEFAULT_ENTRY_CRITERIA[phase].map((c) => ({
        project_id: project.id,
        phase_key: phase,
        ...c
      }));

      await base44.entities.EntryCriteria.bulkCreate(criteriaToCreate);
      queryClient.invalidateQueries({ queryKey: ['entry-criteria'] });
    }

    await updateProjectMutation.mutateAsync({ current_workflow_phase: phase });
    toast.success('Fase iniciada');
  };

  const handleApprovePhase = async (phaseKey, notes) => {
    // Validar criterios de entrada obligatorios antes de aprobar
    if (workflowConfig?.hasEntryCriteria) {
      const criteria = phaseCriteria;
      const mandatoryCriteria = criteria.filter((c) => c.is_mandatory);
      const completedMandatory = mandatoryCriteria.filter((c) => c.is_completed);

      if (mandatoryCriteria.length > 0 && completedMandatory.length < mandatoryCriteria.length) {
        toast.error(`No puedes aprobar esta fase. Debes completar todos los criterios obligatorios: ${completedMandatory.length}/${mandatoryCriteria.length} completados`);
        throw new Error('Criterios obligatorios incompletos');
      }
    }

    try {
      const user = await base44.auth.me();

      if (phaseData) {
        await updatePhaseMutation.mutateAsync({
          id: phaseData.id,
          data: {
            status: 'completed',
            completed_at: new Date().toISOString(),
            completed_by: user.email,
            approved_by: user.email,
            approval_notes: notes,
            entry_criteria_completed: true
          }
        });
      } else {
        await createPhaseMutation.mutateAsync({
          project_id: project.id,
          phase_key: phase,
          status: 'completed',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          completed_by: user.email,
          approved_by: user.email,
          approval_notes: notes,
          entry_criteria_completed: true
        });
      }

      toast.success('Fase aprobada correctamente');
      setApprovingPhase(false);
    } catch (error) {
      console.error('Error aprobando fase:', error);
      toast.error('Error al aprobar la fase');
    }
  };

  const handleDragEnd = (result) => {
    if (onItemReorder) {
      onItemReorder(phase, result);
    }
  };

  return (
    <>
      <Card className={cn(
        "bg-[var(--bg-secondary)] border-[var(--border-primary)] overflow-hidden transition-all duration-200 shadow-sm",
        isCriticalPhase && 'ring-2 ring-[#FF1B7E]/30 border-[#FF1B7E]/20',
        isDragging && 'shadow-lg opacity-80',
        isWorkflowCompleted && "border-[var(--text-primary)]/30 bg-[var(--text-primary)]/5",
        isWorkflowInProgress && "border-[#FF1B7E]/30 bg-[#FF1B7E]/5"
      )}>
        <CardHeader className="hover:bg-[var(--bg-hover)] transition-colors duration-200 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div
                {...dragHandleProps}
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-[var(--bg-hover)] rounded transition-colors">

                <GripVertical className="h-5 w-5 text-[var(--text-secondary)]" />
              </div>
              
              {/* Indicador de estado workflow */}
              {workflowConfig &&
              <div className="flex-shrink-0">
                  {isWorkflowCompleted ?
                <CheckCircle2 className="h-5 w-5 text-[var(--text-primary)]" /> :
                isWorkflowInProgress ?
                <Circle className="h-5 w-5 text-[#FF1B7E]" /> :

                <Circle className="h-5 w-5 text-[var(--text-secondary)]" />
                }
                </div>
              }
              
              <div className="cursor-pointer flex items-center gap-3 flex-1" onClick={onToggle}>
                <div className={`p-2 rounded-xl transition-colors ${isCriticalPhase ? 'bg-[#FF1B7E]/15' : 'bg-[var(--bg-tertiary)]'}`}>
                  <Icon className={`h-5 w-5 ${isCriticalPhase ? 'text-[#FF1B7E]' : 'text-[var(--text-secondary)]'}`} />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2 flex-wrap text-[var(--text-primary)]">
                    {displayName}
                    {isCriticalPhase &&
                    <Badge variant="outline" className="text-xs bg-[#FF1B7E]/10 text-[#FF1B7E] border-[#FF1B7E]/30 font-medium">
                        Crítico
                      </Badge>
                    }
                    {isWorkflowInProgress &&
                    <Badge className="bg-[#FF1B7E]/10 text-[#FF1B7E] border-0 text-xs font-medium">
                        En progreso
                      </Badge>
                    }
                  </CardTitle>
                  <div className="flex items-center gap-2 flex-wrap text-sm text-[var(--text-secondary)] mt-1">
                    <span className="flex justify-between text-sm mb-1">{completed} de {total}</span>
                    {workflowConfig &&
                    <span className="text-xs">• {workflowConfig.approverLabel}</span>
                    }
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-[var(--bg-hover)] transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditPhase(phase);
                }}>

                <Edit2 className="h-4 w-4 text-[var(--text-secondary)]" />
              </Button>
              {hasCritical &&
              <Badge className="flex justify-between text-xs">
                  Críticos pendientes
                </Badge>
              }
              {hasConflicts &&
              <Badge className="bg-[#FF1B7E]/10 text-[#FF1B7E] border-0 text-xs font-medium">
                  Conflictos
                </Badge>
              }
              <div className="w-28">
                <Progress value={progress} className="h-2.5 bg-[var(--bg-tertiary)] [&>div]:bg-[#FF1B7E] rounded-full" />
              </div>
              <span className="text-sm font-semibold text-[var(--text-primary)] w-12 text-right">
                {progress.toFixed(0)}%
              </span>
              <div className="cursor-pointer p-1 hover:bg-[var(--bg-hover)] rounded-lg transition-colors" onClick={onToggle}>
                {isExpanded ?
                <ChevronDown className="h-5 w-5 text-[var(--text-secondary)]" /> :

                <ChevronRight className="h-5 w-5 text-[var(--text-secondary)]" />
                }
              </div>
            </div>
          </div>
        </CardHeader>
        
        <AnimatePresence>
          {isExpanded &&
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}>

              <CardContent className="pt-0 pb-4">
                {/* Controles de workflow */}
                {workflowConfig &&
              <div className="mb-4 pb-4 border-b border-[var(--border-primary)] space-y-2">
                    {workflowConfig.hasEntryCriteria &&
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowEntryCriteria(true)}
                  className="w-full">

                        {mandatoryCriteria.length > 0 ?
                  <span>Ver Criterios ({completedMandatory.length}/{mandatoryCriteria.length})</span> :

                  <span>Definir Criterios</span>
                  }
                      </Button>
                }
                    
                    {!isWorkflowCompleted && !isWorkflowInProgress &&
                <Button
                  size="sm"
                  onClick={handleStartWorkflow}
                  className="w-full">

                        Iniciar Fase
                      </Button>
                }
                    
                    {isWorkflowInProgress && canUserApprove() &&
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setApprovingPhase(true)}
                  className="w-full">

                        Aprobar Fase
                      </Button>
                }
                  </div>
              }
                
                {/* Items del checklist */}
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId={`items-${phase}`}>
                    {(provided) =>
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-1">

                        {items.sort((a, b) => a.order - b.order).map((item, index) =>
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided, snapshot) =>
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}>

                                <ChecklistItemRow
                          item={item}
                          onUpdate={onItemUpdate}
                          onEdit={onItemEdit}
                          userRole={userRole}
                          dragHandleProps={provided.dragHandleProps}
                          isDragging={snapshot.isDragging} />

                              </div>
                      }
                          </Draggable>
                    )}
                        {provided.placeholder}
                      </div>
                  }
                  </Droppable>
                </DragDropContext>
                
                {/* Botón para agregar nuevo ítem */}
                <div className="mt-3 pt-3 border-t border-[var(--border-primary)]">
                  <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-[var(--text-secondary)] border-[var(--border-primary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                  onClick={() => onAddItem(phase)}>

                    <Plus className="h-4 w-4 mr-2" />
                    Agregar ítem a esta fase
                  </Button>
                </div>
              </CardContent>
            </motion.div>
          }
        </AnimatePresence>
      </Card>
      
      {/* Modales */}
      <PhaseApprovalModal
        phase={workflowConfig}
        phaseKey={phase}
        isOpen={approvingPhase}
        onClose={() => setApprovingPhase(false)}
        onApprove={handleApprovePhase} />


      <EntryCriteriaModal
        projectId={project?.id}
        phaseKey={phase}
        phaseName={displayName}
        isOpen={showEntryCriteria}
        onClose={() => setShowEntryCriteria(false)} />

    </>);

}