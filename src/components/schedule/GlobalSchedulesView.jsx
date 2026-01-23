import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Search, Filter, TrendingUp, AlertTriangle, Download } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import ScheduleGanttChart from './ScheduleGanttChart';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export default function GlobalSchedulesView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('weeks');

  // Cargar todos los proyectos
  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list()
  });

  // Cargar todas las fases de cronograma
  const { data: allPhases = [], isLoading: loadingPhases } = useQuery({
    queryKey: ['all-schedule-phases'],
    queryFn: () => base44.entities.SchedulePhase.list()
  });

  // Enriquecer fases con nombre de proyecto
  const enrichedPhases = allPhases.map(phase => {
    const project = projects.find(p => p.id === phase.project_id);
    return {
      ...phase,
      project_name: project?.name || 'Sin nombre'
    };
  });

  // Filtrar proyectos
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Fases de proyectos filtrados
  const filteredPhases = enrichedPhases.filter(phase =>
    filteredProjects.some(p => p.id === phase.project_id)
  );

  // Estadísticas
  const stats = {
    totalProjects: filteredProjects.length,
    inProgress: filteredProjects.filter(p => p.status === 'in_progress').length,
    delayed: filteredPhases.filter(p => p.status === 'delayed').length,
    completed: filteredProjects.filter(p => p.status === 'completed').length
  };

  // Exportar vista global
  const handleExportGlobal = () => {
    if (filteredPhases.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    try {
      const header = [
        ['Cronograma Global de Proyectos'],
        [`Exportado: ${format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}`],
        [`Total proyectos: ${filteredProjects.length}`],
        []
      ];

      const dataRows = [
        ['Proyecto', 'Fase', 'Inicio', 'Fin', 'Duración', 'Estado', 'Responsable']
      ];

      // Agrupar por proyecto
      filteredProjects.forEach(project => {
        const projectPhases = filteredPhases.filter(p => p.project_id === project.id);
        
        projectPhases.forEach((phase, idx) => {
          dataRows.push([
            idx === 0 ? project.name : '', // Solo mostrar nombre en primera fila
            phase.phase_name,
            phase.start_date,
            phase.end_date,
            `${phase.duration_days} días`,
            phase.status,
            phase.responsible_email || '-'
          ]);
        });

        dataRows.push([]); // Línea vacía entre proyectos
      });

      const data = [...header, ...dataRows];
      const ws = XLSX.utils.aoa_to_sheet(data);

      ws['A1'].s = { font: { bold: true, sz: 16 } };
      ws['!cols'] = [
        { wch: 30 }, // Proyecto
        { wch: 25 }, // Fase
        { wch: 12 }, // Inicio
        { wch: 12 }, // Fin
        { wch: 12 }, // Duración
        { wch: 12 }, // Estado
        { wch: 30 }  // Responsable
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Cronograma Global');

      XLSX.writeFile(wb, `cronograma_global_${Date.now()}.xlsx`);
      toast.success('✅ Cronograma global exportado');
    } catch (error) {
      console.error('Error exportando:', error);
      toast.error('Error al exportar');
    }
  };

  if (loadingProjects || loadingPhases) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF1B7E]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Cronograma Global</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Vista comparativa de todos los proyectos activos
          </p>
        </div>
        <Button
          onClick={handleExportGlobal}
          variant="outline"
          className="bg-[var(--bg-secondary)] border-[var(--border-primary)]"
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar Excel
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-xs text-[var(--text-secondary)]">Total proyectos</div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">
                  {stats.totalProjects}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-xs text-[var(--text-secondary)]">En progreso</div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">
                  {stats.inProgress}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-xs text-[var(--text-secondary)]">Fases retrasadas</div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">
                  {stats.delayed}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-xs text-[var(--text-secondary)]">Completados</div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">
                  {stats.completed}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
        <CardContent className="pt-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
              <Input
                placeholder="Buscar proyectos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="in_progress">En progreso</SelectItem>
                <SelectItem value="blocked">Bloqueado</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex bg-[var(--bg-tertiary)] rounded-lg p-1">
              {['weeks', 'months'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 text-xs rounded transition-all ${
                    viewMode === mode
                      ? 'bg-[#FF1B7E] text-white'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {mode === 'weeks' && 'Semanas'}
                  {mode === 'months' && 'Meses'}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline global */}
      {filteredPhases.length > 0 ? (
        <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
          <CardHeader>
            <CardTitle className="text-[var(--text-primary)]">
              Timeline de proyectos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScheduleGanttChart
              phases={filteredPhases}
              viewMode={viewMode}
              isCompact={true}
              showProjectColumn={true}
              onPhaseClick={(phase) => {
                // Navegar al proyecto
                window.location.href = createPageUrl('ProjectChecklist') + `?id=${phase.project_id}`;
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
          <CardContent className="py-12 text-center">
            <Calendar className="h-16 w-16 mx-auto text-[var(--text-tertiary)] mb-4" />
            <p className="text-[var(--text-secondary)]">
              No hay proyectos con cronograma configurado
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}