import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, ExternalLink, Calendar, Users, AlertTriangle, CheckCircle2, Clock, Tag, FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { createPageUrl } from '../../utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProjectDetailPanel({ projectId, onClose }) {
  const { data: project, isLoading } = useQuery({
    queryKey: ['project-detail', projectId],
    queryFn: async () => {
      return await base44.entities.Project.get(projectId);
    },
    enabled: !!projectId
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: async () => {
      const allTasks = await base44.entities.Task.list();
      return allTasks.filter(t => t.project_id === projectId);
    },
    enabled: !!projectId
  });

  const { data: checklistItems = [] } = useQuery({
    queryKey: ['project-checklist', projectId],
    queryFn: async () => {
      const items = await base44.entities.ChecklistItem.filter({ project_id: projectId });
      return items;
    },
    enabled: !!projectId
  });

  if (!projectId) return null;

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    review: 'bg-yellow-100 text-yellow-700',
    blocked: 'bg-red-100 text-red-700',
    completed: 'bg-green-100 text-green-700'
  };

  const statusLabels = {
    draft: 'Borrador',
    in_progress: 'En Progreso',
    review: 'En Revisión',
    blocked: 'Bloqueado',
    completed: 'Completado'
  };

  const taskStats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending' || t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length
  };

  const checklistStats = {
    total: checklistItems.length,
    completed: checklistItems.filter(i => i.status === 'completed').length,
    pending: checklistItems.filter(i => i.status === 'pending').length,
    critical: checklistItems.filter(i => i.weight === 'critical' && i.status !== 'completed').length
  };

  const goToProject = () => {
    window.location.href = createPageUrl('ProjectChecklist') + `?project=${projectId}`;
  };

  return (
    <AnimatePresence>
      {projectId && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full md:w-[600px] bg-white shadow-2xl z-50 overflow-y-auto"
          >
            {/* Barra magenta lateral */}
            <div className="absolute top-0 right-0 bottom-0 w-2 bg-gradient-to-b from-[#FF1B7E] to-[#e6156e]" />
            
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-[var(--border-primary)] px-6 py-4 z-10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                    Detalles del proyecto
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="shrink-0"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF1B7E]"></div>
              </div>
            ) : project ? (
              <div className="p-6 space-y-6">
                {/* Nombre del proyecto */}
                <div>
                  <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                    {project.name}
                  </h3>
                  <Badge className={statusColors[project.status]}>
                    {statusLabels[project.status]}
                  </Badge>
                </div>

                <Separator />

                {/* Descripción */}
                {project.description && (
                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-2 block">
                      Descripción
                    </label>
                    <p className="text-[var(--text-primary)] text-sm">{project.description}</p>
                  </div>
                )}

                {/* Info general */}
                <div className="grid grid-cols-2 gap-4">
                  {project.project_type && (
                    <div>
                      <label className="text-xs font-medium text-[var(--text-secondary)] mb-2 block flex items-center gap-1">
                        <FolderKanban className="h-3 w-3" />
                        Tipo de Proyecto
                      </label>
                      <p className="text-[var(--text-primary)] text-sm capitalize">{project.project_type}</p>
                    </div>
                  )}
                  {project.technology && (
                    <div>
                      <label className="text-xs font-medium text-[var(--text-secondary)] mb-2 block flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        Tecnología
                      </label>
                      <p className="text-[var(--text-primary)] text-sm capitalize">{project.technology}</p>
                    </div>
                  )}
                </div>

                {/* Fechas */}
                {(project.start_date || project.target_date) && (
                  <div className="grid grid-cols-2 gap-4">
                    {project.start_date && (
                      <div>
                        <label className="text-xs font-medium text-[var(--text-secondary)] mb-2 block flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Fecha de Inicio
                        </label>
                        <p className="text-[var(--text-primary)] text-sm">
                          {format(new Date(project.start_date), "d 'de' MMMM, yyyy", { locale: es })}
                        </p>
                      </div>
                    )}
                    {project.target_date && (
                      <div>
                        <label className="text-xs font-medium text-[var(--text-secondary)] mb-2 block flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Fecha Objetivo
                        </label>
                        <p className="text-[var(--text-primary)] text-sm">
                          {format(new Date(project.target_date), "d 'de' MMMM, yyyy", { locale: es })}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <Separator />

                {/* Estadísticas de tareas */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] mb-3 block flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Tareas del Proyecto
                  </label>
                  <div className="grid grid-cols-2 gap-3 p-4 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-secondary)]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-secondary)]">Total</span>
                      <span className="font-semibold text-[var(--text-primary)]">{taskStats.total}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-secondary)]">Pendientes</span>
                      <span className="font-semibold text-orange-600">{taskStats.pending}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-secondary)]">En Progreso</span>
                      <span className="font-semibold text-blue-600">{taskStats.inProgress}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-secondary)]">Completadas</span>
                      <span className="font-semibold text-green-600">{taskStats.completed}</span>
                    </div>
                  </div>
                </div>

                {/* Estadísticas de checklist */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] mb-3 block flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Checklist del Proyecto
                  </label>
                  <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-secondary)] space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[var(--text-secondary)]">Total</span>
                        <span className="font-semibold text-[var(--text-primary)]">{checklistStats.total}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[var(--text-secondary)]">Pendientes</span>
                        <span className="font-semibold text-orange-600">{checklistStats.pending}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[var(--text-secondary)]">Completados</span>
                        <span className="font-semibold text-green-600">{checklistStats.completed}</span>
                      </div>
                      {checklistStats.critical > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[var(--text-secondary)]">Críticos</span>
                          <span className="font-semibold text-red-600">{checklistStats.critical}</span>
                        </div>
                      )}
                    </div>
                    {checklistStats.total > 0 && (
                      <div className="pt-3 border-t border-[var(--border-primary)]">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-[var(--text-secondary)]">Progreso</span>
                          <span className="font-semibold text-[var(--text-primary)]">
                            {Math.round((checklistStats.completed / checklistStats.total) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-[var(--bg-primary)] rounded-full h-2">
                          <div 
                            className="bg-[#FF1B7E] h-2 rounded-full transition-all"
                            style={{ width: `${(checklistStats.completed / checklistStats.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Áreas aplicables */}
                {project.applicable_areas && project.applicable_areas.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-2 block">
                      Áreas Aplicables
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {project.applicable_areas.map(area => (
                        <Badge key={area} variant="outline" className="capitalize text-xs">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Botón para ir al proyecto completo */}
                <Button
                  onClick={goToProject}
                  className="w-full bg-[#FF1B7E] hover:bg-[#e6156e] text-white"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir Proyecto Completo
                </Button>
              </div>
            ) : (
              <div className="p-6 text-center text-[var(--text-secondary)]">
                No se pudo cargar el proyecto
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}