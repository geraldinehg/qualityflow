import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, ArrowRight, Lock, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import PhaseApprovalModal from './PhaseApprovalModal';
import EntryCriteriaModal from './EntryCriteriaModal';
import { DEFAULT_ENTRY_CRITERIA } from './entryCriteriaTemplates';

const WORKFLOW_PHASES = {
  activation: {
    name: 'Activación/Checklist de Entrada',
    approver: 'web_leader',
    approverLabel: 'Líder Web',
    hasEntryCriteria: true,
    order: 1
  },
  planning: {
    name: 'Planeación y Cronograma',
    approver: 'product_owner',
    approverLabel: 'Product Owner',
    hasEntryCriteria: true,
    order: 2
  },
  development: {
    name: 'Desarrollo + QA Intermedio',
    approver: ['developer', 'qa'],
    approverLabel: 'DEV / QA',
    hasEntryCriteria: false,
    order: 3
  },
  qa_complete: {
    name: 'QA Completo',
    approver: 'qa',
    approverLabel: 'QA',
    hasEntryCriteria: false,
    order: 4
  },
  content_upload: {
    name: 'Carga Final de Contenido',
    approver: ['developer', 'product_owner'],
    approverLabel: 'DEV / Producto',
    hasEntryCriteria: false,
    order: 5
  },
  final_approval: {
    name: 'Aprobación Final y Despliegue',
    approver: ['web_leader', 'product_owner'],
    approverLabel: 'Líder Web / PO / Cliente',
    hasEntryCriteria: true,
    order: 6
  },
  stabilization: {
    name: 'Estabilización / QA Post Producción',
    approver: 'qa',
    approverLabel: 'QA',
    hasEntryCriteria: false,
    order: 7
  }
};

export default function WorkflowTracker({ project, userRole }) {
  const [expandedPhase, setExpandedPhase] = useState(null);
  const [approvingPhase, setApprovingPhase] = useState(null);
  const [showEntryCriteria, setShowEntryCriteria] = useState(null);
  
  const queryClient = useQueryClient();

  const { data: workflowPhases = [] } = useQuery({
    queryKey: ['workflow-phases', project.id],
    queryFn: () => base44.entities.WorkflowPhase.filter({ project_id: project.id }),
    enabled: !!project.id
  });

  const { data: entryCriteria = [] } = useQuery({
    queryKey: ['entry-criteria', project.id],
    queryFn: () => base44.entities.EntryCriteria.filter({ project_id: project.id }),
    enabled: !!project.id
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

  const getPhaseData = (phaseKey) => {
    return workflowPhases.find(p => p.phase_key === phaseKey);
  };

  const getEntryCriteriaForPhase = (phaseKey) => {
    return entryCriteria.filter(c => c.phase_key === phaseKey);
  };

  const canAdvanceToPhase = (phaseKey) => {
    const phaseConfig = WORKFLOW_PHASES[phaseKey];
    const prevPhaseKeys = Object.keys(WORKFLOW_PHASES).filter(k => WORKFLOW_PHASES[k].order < phaseConfig.order);
    
    // Verificar que todas las fases anteriores estén completadas
    for (const prevKey of prevPhaseKeys) {
      const prevPhase = getPhaseData(prevKey);
      if (!prevPhase || prevPhase.status !== 'completed') {
        return { canAdvance: false, reason: `La fase "${WORKFLOW_PHASES[prevKey].name}" debe completarse primero` };
      }

      // Validar criterios de entrada obligatorios de fases anteriores
      if (WORKFLOW_PHASES[prevKey].hasEntryCriteria) {
        const criteria = getEntryCriteriaForPhase(prevKey);
        const mandatoryCriteria = criteria.filter(c => c.is_mandatory);
        const completedMandatory = mandatoryCriteria.filter(c => c.is_completed);
        
        if (mandatoryCriteria.length > 0 && completedMandatory.length < mandatoryCriteria.length) {
          return { 
            canAdvance: false, 
            reason: `Debe completar todos los criterios de "${WORKFLOW_PHASES[prevKey].name}" (${completedMandatory.length}/${mandatoryCriteria.length})` 
          };
        }
      }
    }
    
    return { canAdvance: true };
  };

  const handleStartPhase = async (phaseKey) => {
    const validation = canAdvanceToPhase(phaseKey);
    if (!validation.canAdvance) {
      toast.error(validation.reason);
      return;
    }

    const existingPhase = getPhaseData(phaseKey);
    if (existingPhase) {
      await updatePhaseMutation.mutateAsync({
        id: existingPhase.id,
        data: { status: 'in_progress', started_at: new Date().toISOString() }
      });
    } else {
      await createPhaseMutation.mutateAsync({
        project_id: project.id,
        phase_key: phaseKey,
        status: 'in_progress',
        started_at: new Date().toISOString()
      });
    }

    // Crear criterios de entrada predefinidos si la fase los tiene
    const existingCriteria = getEntryCriteriaForPhase(phaseKey);
    if (existingCriteria.length === 0 && DEFAULT_ENTRY_CRITERIA[phaseKey]) {
      const criteriaToCreate = DEFAULT_ENTRY_CRITERIA[phaseKey].map(c => ({
        project_id: project.id,
        phase_key: phaseKey,
        ...c
      }));
      
      await base44.entities.EntryCriteria.bulkCreate(criteriaToCreate);
      queryClient.invalidateQueries({ queryKey: ['entry-criteria'] });
    }

    await updateProjectMutation.mutateAsync({ current_workflow_phase: phaseKey });
    toast.success('Fase iniciada');
  };

  const handleApprovePhase = async (phaseKey, notes) => {
    // Validar criterios de entrada obligatorios antes de aprobar
    if (WORKFLOW_PHASES[phaseKey].hasEntryCriteria) {
      const criteria = getEntryCriteriaForPhase(phaseKey);
      const mandatoryCriteria = criteria.filter(c => c.is_mandatory);
      const completedMandatory = mandatoryCriteria.filter(c => c.is_completed);
      
      if (mandatoryCriteria.length > 0 && completedMandatory.length < mandatoryCriteria.length) {
        toast.error(`Debe completar todos los criterios obligatorios (${completedMandatory.length}/${mandatoryCriteria.length})`);
        setApprovingPhase(null);
        return;
      }
    }

    const user = await base44.auth.me();
    const phaseData = getPhaseData(phaseKey);
    
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
      // Crear la fase si no existe
      await createPhaseMutation.mutateAsync({
        project_id: project.id,
        phase_key: phaseKey,
        status: 'completed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        completed_by: user.email,
        approved_by: user.email,
        approval_notes: notes,
        entry_criteria_completed: true
      });
    }

    // Avanzar al siguiente fase automáticamente
    const currentOrder = WORKFLOW_PHASES[phaseKey].order;
    const nextPhase = Object.keys(WORKFLOW_PHASES).find(k => WORKFLOW_PHASES[k].order === currentOrder + 1);
    
    if (nextPhase) {
      await updateProjectMutation.mutateAsync({ current_workflow_phase: nextPhase });
    }

    setApprovingPhase(null);
    toast.success('Fase aprobada correctamente');
  };

  const canUserApprove = (phaseKey) => {
    const phaseConfig = WORKFLOW_PHASES[phaseKey];
    if (Array.isArray(phaseConfig.approver)) {
      return phaseConfig.approver.includes(userRole);
    }
    return phaseConfig.approver === userRole;
  };

  const orderedPhases = Object.entries(WORKFLOW_PHASES).sort((a, b) => a[1].order - b[1].order);
  const currentPhaseIndex = orderedPhases.findIndex(([key]) => key === project.current_workflow_phase);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>Flujo de Trabajo</span>
          <Badge variant="outline">
            {orderedPhases.filter(([key]) => {
              const phase = getPhaseData(key);
              return phase?.status === 'completed';
            }).length} / {orderedPhases.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress 
          value={(orderedPhases.filter(([key]) => {
            const phase = getPhaseData(key);
            return phase?.status === 'completed';
          }).length / orderedPhases.length) * 100} 
          className="h-2"
        />

        <div className="space-y-2">
          {orderedPhases.map(([phaseKey, phaseConfig], index) => {
            const phaseData = getPhaseData(phaseKey);
            const isCompleted = phaseData?.status === 'completed';
            const isInProgress = phaseData?.status === 'in_progress';
            const isCurrent = project.current_workflow_phase === phaseKey;
            const isPending = !phaseData || phaseData.status === 'pending';
            const validation = canAdvanceToPhase(phaseKey);
            const isBlocked = !validation.canAdvance && index > currentPhaseIndex;
            const phaseCriteria = getEntryCriteriaForPhase(phaseKey);
            const mandatoryCriteria = phaseCriteria.filter(c => c.is_mandatory);
            const completedMandatory = mandatoryCriteria.filter(c => c.is_completed);

            return (
              <div key={phaseKey} className={cn(
                "border rounded-lg p-3 transition-all",
                isCompleted && "bg-green-50 border-green-200",
                isInProgress && "bg-blue-50 border-blue-200",
                isCurrent && !isCompleted && "ring-2 ring-blue-400",
                isBlocked && "bg-slate-50 border-slate-200 opacity-60"
              )}>
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : isBlocked ? (
                        <Lock className="h-5 w-5 text-slate-400" />
                      ) : (
                        <Circle className={cn(
                          "h-5 w-5",
                          isInProgress ? "text-blue-600" : "text-slate-300"
                        )} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm text-slate-900 break-words">
                          {phaseConfig.name}
                        </h4>
                        {isInProgress && (
                          <Badge className="bg-blue-100 text-blue-700 text-xs whitespace-nowrap">En progreso</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 break-words">
                        Aprobador: {phaseConfig.approverLabel}
                      </p>
                      
                      {phaseConfig.hasEntryCriteria && (
                        <button
                          onClick={() => setShowEntryCriteria(phaseKey)}
                          className="text-xs text-blue-600 hover:underline mt-1 flex items-center gap-1 break-words"
                        >
                          {mandatoryCriteria.length > 0 ? (
                            <span>Criterios: {completedMandatory.length}/{mandatoryCriteria.length}</span>
                          ) : (
                            <span>Definir criterios de entrada</span>
                          )}
                        </button>
                      )}

                      {phaseData?.completed_at && (
                        <p className="text-xs text-slate-500 mt-1 break-words">
                          Completado: {format(new Date(phaseData.completed_at), "d MMM yyyy HH:mm", { locale: es })}
                        </p>
                      )}

                      {isBlocked && (
                        <div className="flex items-start gap-1 mt-1 text-xs text-amber-600">
                          <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                          <span className="break-words">{validation.reason}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {(isPending && !isBlocked || (isInProgress && canUserApprove(phaseKey))) && (
                    <div className="flex gap-2 ml-8">
                      {isPending && !isBlocked && (
                        <Button
                          size="sm"
                          onClick={() => handleStartPhase(phaseKey)}
                          className="w-full sm:w-auto"
                        >
                          Iniciar
                        </Button>
                      )}
                      {isInProgress && canUserApprove(phaseKey) && (
                        <Button
                          size="sm"
                          onClick={() => setApprovingPhase(phaseKey)}
                          className="w-full sm:w-auto"
                        >
                          Aprobar
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <PhaseApprovalModal
          phase={approvingPhase ? WORKFLOW_PHASES[approvingPhase] : null}
          phaseKey={approvingPhase}
          isOpen={!!approvingPhase}
          onClose={() => setApprovingPhase(null)}
          onApprove={handleApprovePhase}
        />

        <EntryCriteriaModal
          projectId={project.id}
          phaseKey={showEntryCriteria}
          phaseName={showEntryCriteria ? WORKFLOW_PHASES[showEntryCriteria].name : ''}
          isOpen={!!showEntryCriteria}
          onClose={() => setShowEntryCriteria(null)}
        />
      </CardContent>
    </Card>
  );
}