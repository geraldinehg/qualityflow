import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Bug, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';

export default function QADashboard({ user }) {
  const navigate = useNavigate();
  // Tareas QA
  const { data: qaTasks = [] } = useQuery({
    queryKey: ['qa-all-tasks'],
    queryFn: async () => {
      const allTasks = await base44.entities.Task.list();
      return allTasks.filter(t => 
        t.tags?.includes('qa') ||
        t.assigned_to?.includes(user.email)
      );
    }
  });

  const metrics = {
    total: qaTasks.length,
    pending: qaTasks.filter(t => t.status === 'pending' || t.status === 'todo').length,
    inTest: qaTasks.filter(t => t.status === 'in_progress').length,
    approved: qaTasks.filter(t => t.status === 'completed').length,
    rejected: qaTasks.filter(t => t.status === 'rejected').length,
    bugs: qaTasks.filter(t => t.tags?.includes('bug')).length,
    criticalBugs: qaTasks.filter(t => t.tags?.includes('bug') && t.priority === 'high').length
  };

  // Bugs por estado
  const bugsList = qaTasks
    .filter(t => t.tags?.includes('bug') && t.status !== 'completed')
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
    });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
          Dashboard QA
        </h2>
        <p className="text-[var(--text-secondary)]">Seguimiento de calidad y testing</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
              En Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metrics.inTest}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
              Aprobadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics.approved}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
              Rechazadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics.rejected}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bugs críticos */}
      {metrics.criticalBugs > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Bugs Críticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700">
              {metrics.criticalBugs} bug{metrics.criticalBugs > 1 ? 's' : ''} crítico{metrics.criticalBugs > 1 ? 's' : ''} requiere{metrics.criticalBugs > 1 ? 'n' : ''} atención inmediata
            </p>
          </CardContent>
        </Card>
      )}

      {/* Resumen de bugs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Estado de Bugs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-secondary)]">Total de bugs:</span>
              <span className="font-semibold">{metrics.bugs}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-secondary)]">Críticos:</span>
              <span className="font-semibold text-red-600">{metrics.criticalBugs}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-secondary)]">Bugs abiertos:</span>
              <span className="font-semibold">{bugsList.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de bugs pendientes */}
      {bugsList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bugs Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bugsList.slice(0, 10).map((task) => {
                const priorityColors = {
                  high: 'bg-red-100 text-red-700',
                  medium: 'bg-yellow-100 text-yellow-700',
                  low: 'bg-gray-100 text-gray-700'
                };

                return (
                  <div
                    key={task.id}
                    className="border border-[var(--border-primary)] rounded-lg p-3 hover:bg-[var(--bg-hover)] hover:border-[#FF1B7E] transition-all cursor-pointer group"
                    onClick={() => navigate(createPageUrl('ProjectChecklist') + `?project=${task.project_id}`)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="font-medium text-[var(--text-primary)] mb-1 group-hover:text-[#FF1B7E] transition-colors">
                          {task.title}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={priorityColors[task.priority] || priorityColors.low}>
                            {task.priority || 'media'}
                          </Badge>
                          {task.status === 'rejected' && (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Rechazado
                            </Badge>
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
      )}
    </div>
  );
}