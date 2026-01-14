import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Edit2, Trash2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import EditScheduleTaskModal from './EditScheduleTaskModal';

const AREA_COLORS = {
  creativity: 'bg-purple-500',
  software: 'bg-blue-500',
  seo: 'bg-green-500',
  marketing: 'bg-pink-500',
  paid: 'bg-orange-500',
  social: 'bg-cyan-500',
  product: 'bg-indigo-500',
  qa: 'bg-red-500'
};

const AREA_NAMES = {
  creativity: 'Creatividad',
  software: 'Software',
  seo: 'SEO',
  marketing: 'Marketing',
  paid: 'Paid Media',
  social: 'Social Media',
  product: 'Producto',
  qa: 'QA'
};

export default function ProjectSchedule({ projectId, project }) {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [editingTask, setEditingTask] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [draggingTask, setDraggingTask] = useState(null);

  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['schedule-tasks', projectId],
    queryFn: () => base44.entities.ScheduleTask.filter({ project_id: projectId }),
    enabled: !!projectId
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => {
      const endDate = addDays(parseISO(data.start_date), data.duration);
      return base44.entities.ScheduleTask.create({
        ...data,
        end_date: format(endDate, 'yyyy-MM-dd')
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-tasks', projectId] });
      setIsCreating(false);
      toast.success('Tarea agregada al cronograma');
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => {
      if (data.start_date && data.duration) {
        const endDate = addDays(parseISO(data.start_date), data.duration);
        data.end_date = format(endDate, 'yyyy-MM-dd');
      }
      return base44.entities.ScheduleTask.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-tasks', projectId] });
      setEditingTask(null);
      toast.success('Tarea actualizada');
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.ScheduleTask.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-tasks', projectId] });
      setEditingTask(null);
      toast.success('Tarea eliminada');
    }
  });

  const weekDays = useMemo(() => {
    return eachDayOfInterval({
      start: currentWeekStart,
      end: endOfWeek(currentWeekStart, { weekStartsOn: 1 })
    });
  }, [currentWeekStart]);

  const nextWeek = () => setCurrentWeekStart(addDays(currentWeekStart, 7));
  const prevWeek = () => setCurrentWeekStart(addDays(currentWeekStart, -7));
  const goToToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const tasksInView = useMemo(() => {
    return tasks.filter(task => {
      const taskStart = parseISO(task.start_date);
      const taskEnd = parseISO(task.end_date);
      const viewStart = currentWeekStart;
      const viewEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
      
      return (taskStart <= viewEnd && taskEnd >= viewStart);
    });
  }, [tasks, currentWeekStart]);

  const handleDragStart = (e, task) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggingTask(task);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, newStartDate) => {
    e.preventDefault();
    if (!draggingTask) return;

    const currentStart = parseISO(draggingTask.start_date);
    const daysDiff = differenceInDays(newStartDate, currentStart);
    
    if (daysDiff === 0) {
      setDraggingTask(null);
      return;
    }

    const newStart = format(newStartDate, 'yyyy-MM-dd');
    updateTaskMutation.mutate({
      id: draggingTask.id,
      data: { start_date: newStart }
    });

    setDraggingTask(null);
  };

  const getTaskPosition = (task, day) => {
    const taskStart = parseISO(task.start_date);
    const taskEnd = parseISO(task.end_date);
    
    if (day < taskStart || day > taskEnd) return null;

    const isStart = isSameDay(day, taskStart);
    const isEnd = isSameDay(day, taskEnd);
    
    return { isStart, isEnd };
  };

  const totalDuration = useMemo(() => {
    return tasks.reduce((sum, task) => sum + (task.duration || 0), 0);
  }, [tasks]);

  const areaBreakdown = useMemo(() => {
    const breakdown = {};
    tasks.forEach(task => {
      if (!breakdown[task.area]) {
        breakdown[task.area] = 0;
      }
      breakdown[task.area] += task.duration || 0;
    });
    return breakdown;
  }, [tasks]);

  const exportToExcel = () => {
    const worksheetData = [
      ['Cronograma del Proyecto', project?.name || ''],
      [],
      ['Tarea', 'Área', 'Fecha Inicio', 'Duración (días)', 'Fecha Fin', 'Responsable', 'Estado', 'Notas']
    ];

    tasks
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
      .forEach(task => {
        worksheetData.push([
          task.name,
          AREA_NAMES[task.area],
          format(parseISO(task.start_date), 'dd/MM/yyyy'),
          task.duration,
          format(parseISO(task.end_date), 'dd/MM/yyyy'),
          task.assigned_to || '',
          task.status === 'pending' ? 'Pendiente' : 
            task.status === 'in_progress' ? 'En progreso' : 
            task.status === 'completed' ? 'Completada' : 'Bloqueada',
          task.notes || ''
        ]);
      });

    worksheetData.push([]);
    worksheetData.push(['Resumen por Área']);
    Object.entries(areaBreakdown).forEach(([area, days]) => {
      worksheetData.push([AREA_NAMES[area], `${days} días`]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cronograma');

    worksheet['!cols'] = [
      { wch: 30 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 25 },
      { wch: 15 },
      { wch: 40 }
    ];

    XLSX.writeFile(workbook, `Cronograma_${project?.name || 'Proyecto'}_${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
    toast.success('Cronograma exportado a Excel');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF1B7E]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">Total de Tareas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--text-primary)]">{tasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">Duración Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--text-primary)]">{totalDuration} días</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">Áreas Involucradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--text-primary)]">{Object.keys(areaBreakdown).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Desglose por área */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Tiempo por Área</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(areaBreakdown).map(([area, days]) => (
              <Badge key={area} variant="outline" className="px-3 py-1">
                <div className={`w-2 h-2 rounded-full ${AREA_COLORS[area]} mr-2`} />
                {AREA_NAMES[area]}: {days} días
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Controles */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>
            Hoy
          </Button>
          <Button variant="outline" size="icon" onClick={nextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-[var(--text-primary)] ml-2">
            {format(currentWeekStart, 'MMMM yyyy', { locale: es })}
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Exportar a Excel
          </Button>
          <Button onClick={() => setIsCreating(true)} className="bg-[#FF1B7E] hover:bg-[#e6156e] text-white">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tarea
          </Button>
        </div>
      </div>

      {/* Vista Gantt */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header de días */}
              <div className="grid grid-cols-8 border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
                <div className="p-3 border-r border-[var(--border-primary)] font-semibold text-sm text-[var(--text-primary)]">
                  Tarea
                </div>
                {weekDays.map(day => (
                  <div 
                    key={day.toString()} 
                    className={`p-3 text-center border-r border-[var(--border-primary)] ${
                      isSameDay(day, new Date()) ? 'bg-[#FF1B7E]/10' : ''
                    }`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, day)}
                  >
                    <div className="text-xs text-[var(--text-secondary)] uppercase">
                      {format(day, 'EEE', { locale: es })}
                    </div>
                    <div className="text-sm font-semibold text-[var(--text-primary)]">
                      {format(day, 'd')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tareas */}
              {tasksInView.length === 0 ? (
                <div className="p-8 text-center text-[var(--text-secondary)]">
                  No hay tareas en esta semana
                </div>
              ) : (
                tasksInView.map(task => (
                  <div key={task.id} className="grid grid-cols-8 border-b border-[var(--border-primary)] hover:bg-[var(--bg-hover)]">
                    <div className="p-3 border-r border-[var(--border-primary)] flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className={`w-2 h-2 rounded-full ${AREA_COLORS[task.area]} flex-shrink-0`} />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                            {task.name}
                          </div>
                          <div className="text-xs text-[var(--text-secondary)]">
                            {task.duration} días
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0 ml-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => setEditingTask(task)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {weekDays.map(day => {
                      const position = getTaskPosition(task, day);
                      
                      return (
                        <div 
                          key={day.toString()} 
                          className="border-r border-[var(--border-primary)] p-1"
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, day)}
                        >
                          {position && (
                            <div
                              draggable
                              onDragStart={(e) => handleDragStart(e, task)}
                              className={`h-8 ${AREA_COLORS[task.area]} cursor-move opacity-90 hover:opacity-100 flex items-center justify-center text-white text-xs font-medium ${
                                position.isStart ? 'rounded-l-md' : ''
                              } ${
                                position.isEnd ? 'rounded-r-md' : ''
                              }`}
                            >
                              {position.isStart && task.name.substring(0, 10)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de tareas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Todas las Tareas del Cronograma</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)] text-center py-4">
                No hay tareas en el cronograma
              </p>
            ) : (
              tasks
                .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
                .map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3 border border-[var(--border-primary)] rounded-lg hover:bg-[var(--bg-hover)]">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-3 h-3 rounded-full ${AREA_COLORS[task.area]} flex-shrink-0`} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {task.name}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)]">
                          {format(parseISO(task.start_date), 'd MMM', { locale: es })} - {format(parseISO(task.end_date), 'd MMM', { locale: es })} ({task.duration} días) • {AREA_NAMES[task.area]}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Badge variant={task.status === 'completed' ? 'default' : 'outline'}>
                        {task.status === 'pending' && 'Pendiente'}
                        {task.status === 'in_progress' && 'En progreso'}
                        {task.status === 'completed' && 'Completada'}
                        {task.status === 'blocked' && 'Bloqueada'}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setEditingTask(task)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de edición/creación */}
      <EditScheduleTaskModal
        task={editingTask}
        isOpen={isCreating || !!editingTask}
        onClose={() => {
          setIsCreating(false);
          setEditingTask(null);
        }}
        onSave={(data) => {
          if (editingTask) {
            updateTaskMutation.mutate({ id: editingTask.id, data });
          } else {
            createTaskMutation.mutate({ ...data, project_id: projectId });
          }
        }}
        onDelete={(id) => deleteTaskMutation.mutate(id)}
        isLoading={createTaskMutation.isPending || updateTaskMutation.isPending || deleteTaskMutation.isPending}
      />
    </div>
  );
}