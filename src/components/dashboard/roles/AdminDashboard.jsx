import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, Clock, TrendingUp, ArrowRight, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../../utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const { data: projects = [] } = useQuery({
    queryKey: ['projects-admin'],
    queryFn: () => base44.entities.Project.list()
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-admin'],
    queryFn: () => base44.entities.Task.list()
  });

  // Métricas globales
  const metrics = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'in_progress').length,
    blockedProjects: projects.filter(p => p.status === 'blocked').length,
    totalTasks: tasks.length,
    criticalTasks: tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length,
    overdueTasks: tasks.filter(t => {
      if (!t.due_date || t.status === 'completed') return false;
      return new Date(t.due_date) < new Date();
    }).length,
    qaTasks: tasks.filter(t => t.tags?.includes('qa')).length
  };

  // Resumen por área
  const areaStats = {};
  projects.forEach(project => {
    project.applicable_areas?.forEach(area => {
      if (!areaStats[area]) {
        areaStats[area] = { total: 0, active: 0, blocked: 0 };
      }
      areaStats[area].total++;
      if (project.status === 'in_progress') areaStats[area].active++;
      if (project.status === 'blocked') areaStats[area].blocked++;
    });
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
          Dashboard Administrador
        </h2>
        <p className="text-[var(--text-secondary)]">Vista global del sistema</p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
              Proyectos Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--text-primary)]">
              {metrics.activeProjects}
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              de {metrics.totalProjects} totales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
              Tareas Críticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics.criticalTasks}
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              alta prioridad
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
              Tareas Vencidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {metrics.overdueTasks}
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              requieren atención
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
              Proyectos Bloqueados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics.blockedProjects}
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              necesitan resolución
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resumen por área - clicable */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Resumen por Área
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(areaStats).map(([area, stats]) => {
              const areaProject = projects.find(p => p.applicable_areas?.includes(area));
              return (
                <div 
                  key={area} 
                  className="border border-[var(--border-primary)] rounded-lg p-4 hover:border-[#FF1B7E] hover:shadow-lg cursor-pointer transition-all group"
                  onClick={() => {
                    if (areaProject) navigate(createPageUrl('ProjectChecklist') + `?project=${areaProject.id}`);
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-[var(--text-primary)] capitalize group-hover:text-[#FF1B7E] transition-colors">
                      {area}
                    </div>
                    <ArrowRight className="h-4 w-4 text-[var(--text-tertiary)] group-hover:text-[#FF1B7E] transition-colors" />
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Total:</span>
                      <span className="font-medium">{stats.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Activos:</span>
                      <span className="font-medium text-blue-600">{stats.active}</span>
                    </div>
                    {stats.blocked > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">Bloqueados:</span>
                        <span className="font-medium text-red-600">{stats.blocked}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actividad reciente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Tareas Críticas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tasks
              .filter(t => t.priority === 'high' && t.status !== 'completed')
              .slice(0, 5)
              .map(task => {
                const project = projects.find(p => p.id === task.project_id);
                return (
                  <div
                    key={task.id}
                    className="border border-[var(--border-primary)] rounded-lg p-3 hover:border-[#FF1B7E] cursor-pointer transition-all group"
                    onClick={() => navigate(createPageUrl('ProjectChecklist') + `?project=${task.project_id}`)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="font-medium text-[var(--text-primary)] mb-1 group-hover:text-[#FF1B7E] transition-colors">
                          {task.title}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap text-xs text-[var(--text-secondary)]">
                          {project && <span>{project.name}</span>}
                          {task.due_date && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(task.due_date), "d 'de' MMM", { locale: es })}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-[var(--text-tertiary)] group-hover:text-[#FF1B7E] transition-colors" />
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Seguimiento QA */}
      <Card>
        <CardHeader>
          <CardTitle>Seguimiento QA</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-[var(--text-secondary)]">
            Total de tareas en QA: <span className="font-semibold text-[var(--text-primary)]">{metrics.qaTasks}</span>
          </div>
        </CardContent>
      </Card>

      {/* Alertas críticas */}
      {(metrics.criticalTasks > 0 || metrics.overdueTasks > 0 || metrics.blockedProjects > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-5 w-5" />
              Alertas Críticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {metrics.criticalTasks > 0 && (
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  {metrics.criticalTasks} tareas de alta prioridad pendientes
                </li>
              )}
              {metrics.overdueTasks > 0 && (
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  {metrics.overdueTasks} tareas vencidas
                </li>
              )}
              {metrics.blockedProjects > 0 && (
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  {metrics.blockedProjects} proyectos bloqueados
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}