import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Users, Clock, ArrowRight, Bug } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../../utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const AREA_MAP = {
  leader_web: 'web',
  leader_product: 'producto',
  leader_ux: 'ux',
  leader_ui: 'ui',
  leader_seo: 'seo',
  leader_paid: 'paid',
  leader_marketing: 'marketing',
  leader_software: 'software',
  leader_dev_web: 'desarrollo_web'
};

export default function LeaderDashboard({ user, teamMember, onSectionChange }) {
  const navigate = useNavigate();
  
  const goToProject = (projectId) => {
    if (projectId) {
      navigate(createPageUrl('ProjectChecklist') + `?project=${projectId}`);
    }
  };
  
  const myArea = AREA_MAP[teamMember?.role] || '';
  const isDevLeader = ['leader_software', 'leader_dev_web'].includes(teamMember?.role);

  // Proyectos de mi área
  const { data: projects = [] } = useQuery({
    queryKey: ['projects-leader', myArea, user?.email],
    queryFn: async () => {
      if (!myArea || !user?.email) return [];
      const allProjects = await base44.entities.Project.list();
      return allProjects.filter(p => 
        p.applicable_areas?.includes(myArea) ||
        p.area_responsibles?.[myArea] === user.email
      );
    },
    enabled: !!myArea && !!user?.email
  });

  // Tareas de mi área
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-leader', myArea, user?.email],
    queryFn: async () => {
      if (!projects || projects.length === 0) return [];
      const allTasks = await base44.entities.Task.list();
      return allTasks.filter(t => 
        projects.some(p => p.id === t.project_id)
      );
    },
    enabled: projects.length > 0
  });

  // Tareas QA (solo para líderes de desarrollo)
  const { data: qaTasks = [] } = useQuery({
    queryKey: ['qa-tasks-leader', user?.email],
    queryFn: async () => {
      const allTasks = await base44.entities.Task.list();
      return allTasks.filter(t => t.tags?.includes('qa'));
    },
    enabled: isDevLeader && !!user?.email
  });

  const metrics = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'in_progress').length,
    myTasks: tasks.filter(t => t.assigned_to?.includes(user.email)).length,
    teamTasks: tasks.length,
    criticalTasks: tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length,
    overdueTasks: tasks.filter(t => {
      if (!t.due_date || t.status === 'completed') return false;
      return new Date(t.due_date) < new Date();
    }).length,
    blockedTasks: tasks.filter(t => t.status === 'blocked').length
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
          Dashboard Líder - {myArea.charAt(0).toUpperCase() + myArea.slice(1)}
        </h2>
        <p className="text-[var(--text-secondary)]">Seguimiento de tu área</p>
      </div>

      {/* Métricas */}
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
              Mis Tareas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--text-primary)]">
              {metrics.myTasks}
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              asignadas a mí
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
              Tareas del Equipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--text-primary)]">
              {metrics.teamTasks}
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              en el área
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
      </div>

      {/* Alertas */}
      {(metrics.overdueTasks > 0 || metrics.blockedTasks > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-5 w-5" />
              Atención Requerida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {metrics.overdueTasks > 0 && (
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  {metrics.overdueTasks} tareas vencidas
                </li>
              )}
              {metrics.blockedTasks > 0 && (
                <li className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  {metrics.blockedTasks} tareas bloqueadas
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Seguimiento QA (solo para líderes de desarrollo) */}
      {isDevLeader && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Seguimiento QA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4">
              <div 
                className="flex justify-between items-center p-2 rounded hover:bg-[var(--bg-hover)] cursor-pointer transition-colors"
                onClick={() => {
                  const task = qaTasks[0];
                  if (task) goToProject(task.project_id);
                }}
              >
                <span className="text-sm text-[var(--text-secondary)]">Total en QA:</span>
                <span className="font-semibold">{qaTasks.length}</span>
              </div>
              <div 
                className="flex justify-between items-center p-2 rounded hover:bg-[var(--bg-hover)] cursor-pointer transition-colors"
                onClick={() => {
                  const task = qaTasks.find(t => t.status === 'pending' || t.status === 'todo');
                  if (task) goToProject(task.project_id);
                }}
              >
                <span className="text-sm text-[var(--text-secondary)]">Pendientes:</span>
                <span className="font-semibold">
                  {qaTasks.filter(t => t.status === 'pending' || t.status === 'todo').length}
                </span>
              </div>
              <div 
                className="flex justify-between items-center p-2 rounded hover:bg-red-50 cursor-pointer transition-colors"
                onClick={() => {
                  const task = qaTasks.find(t => t.priority === 'high' && t.tags?.includes('bug'));
                  if (task) goToProject(task.project_id);
                }}
              >
                <span className="text-sm text-[var(--text-secondary)]">Bugs críticos:</span>
                <span className="font-semibold text-red-600">
                  {qaTasks.filter(t => t.priority === 'high' && t.tags?.includes('bug')).length}
                </span>
              </div>
            </div>

            {/* Lista de bugs recientes */}
            {qaTasks.filter(t => t.tags?.includes('bug')).slice(0, 3).map(task => (
              <div
                key={task.id}
                className="border border-[var(--border-primary)] rounded-lg p-3 mb-2 hover:border-[#FF1B7E] cursor-pointer transition-all group"
                onClick={() => goToProject(task.project_id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[#FF1B7E] transition-colors">
                      {task.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={task.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}>
                        {task.priority || 'media'}
                      </Badge>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[var(--text-tertiary)] group-hover:text-[#FF1B7E] transition-colors" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Carga del equipo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Carga del Equipo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-[var(--text-secondary)]">
            {metrics.teamTasks} tareas distribuidas en el área
          </div>
        </CardContent>
      </Card>
    </div>
  );
}