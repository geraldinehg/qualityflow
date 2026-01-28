import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../../utils';

export default function OperationalDashboard({ user, teamMember, onSectionChange }) {
  const navigate = useNavigate();
  
  const goToProject = (projectId) => {
    navigate(createPageUrl('ProjectChecklist') + `?project=${projectId}`);
  };
  // Mis tareas
  const { data: myTasks = [] } = useQuery({
    queryKey: ['my-tasks', user.email],
    queryFn: async () => {
      const allTasks = await base44.entities.Task.list();
      return allTasks.filter(t => 
        t.assigned_to?.includes(user.email) ||
        t.created_by === user.email
      );
    }
  });

  const metrics = {
    total: myTasks.length,
    pending: myTasks.filter(t => t.status === 'pending' || t.status === 'todo').length,
    inProgress: myTasks.filter(t => t.status === 'in_progress').length,
    completed: myTasks.filter(t => t.status === 'completed').length,
    highPriority: myTasks.filter(t => t.priority === 'high' && t.status !== 'completed').length,
    overdue: myTasks.filter(t => {
      if (!t.due_date || t.status === 'completed') return false;
      return new Date(t.due_date) < new Date();
    }).length
  };

  // Tareas por prioridad
  const tasksByPriority = myTasks
    .filter(t => t.status !== 'completed')
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
    })
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
          Mi Panel de Trabajo
        </h2>
        <p className="text-[var(--text-secondary)]">Tus tareas y prioridades</p>
      </div>

      {/* Métricas clicables */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all hover:border-orange-500"
          onClick={() => {
            const task = myTasks.find(t => t.status === 'pending' || t.status === 'todo');
            if (task) goToProject(task.project_id);
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {metrics.pending}
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-all hover:border-blue-500"
          onClick={() => {
            const task = myTasks.find(t => t.status === 'in_progress');
            if (task) goToProject(task.project_id);
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
              En Progreso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metrics.inProgress}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
              Completadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics.completed}
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-all hover:border-red-500"
          onClick={() => {
            const task = myTasks.find(t => t.priority === 'high' && t.status !== 'completed');
            if (task) goToProject(task.project_id);
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
              Alta Prioridad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics.highPriority}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {metrics.overdue > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Tareas Vencidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700">
              Tienes {metrics.overdue} tarea{metrics.overdue > 1 ? 's' : ''} vencida{metrics.overdue > 1 ? 's' : ''} que requiere{metrics.overdue > 1 ? 'n' : ''} atención inmediata.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Mi foco hoy */}
      <Card>
        <CardHeader>
          <CardTitle>Mi Foco Hoy</CardTitle>
        </CardHeader>
        <CardContent>
          {tasksByPriority.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-secondary)]">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>¡Excelente! No tienes tareas pendientes.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasksByPriority.map((task) => {
                const isOverdue = task.due_date && new Date(task.due_date) < new Date();
                const priorityColors = {
                  high: 'bg-red-100 text-red-700',
                  medium: 'bg-yellow-100 text-yellow-700',
                  low: 'bg-gray-100 text-gray-700'
                };

                return (
                  <div
                    key={task.id}
                    className="border border-[var(--border-primary)] rounded-lg p-3 hover:bg-[var(--bg-hover)] hover:border-[#FF1B7E] transition-all cursor-pointer group"
                    onClick={() => goToProject(task.project_id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="font-medium text-[var(--text-primary)] mb-1 group-hover:text-[#FF1B7E] transition-colors">
                          {task.title}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={priorityColors[task.priority] || priorityColors.low}>
                            {task.priority || 'media'}
                          </Badge>
                          {task.due_date && (
                            <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-600' : 'text-[var(--text-tertiary)]'}`}>
                              <Clock className="h-3 w-3" />
                              {format(new Date(task.due_date), "d 'de' MMM", { locale: es })}
                            </div>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-[var(--text-tertiary)] group-hover:text-[#FF1B7E] transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}