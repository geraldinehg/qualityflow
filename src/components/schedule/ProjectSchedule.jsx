import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Edit2, Trash2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, differenceInDays, isWeekend, getDay } from 'date-fns';
import { es } from 'date-fns/locale';

// Función para añadir días hábiles (excluyendo sábados y domingos)
const addBusinessDays = (date, days) => {
  let currentDate = new Date(date);
  let remainingDays = days;
  
  while (remainingDays > 0) {
    currentDate = addDays(currentDate, 1);
    if (!isWeekend(currentDate)) {
      remainingDays--;
    }
  }
  
  return currentDate;
};
import { toast } from 'sonner';
import EditScheduleTaskModal from './EditScheduleTaskModal';
import ExcelImportButton from './ExcelImportButton';
import TimelineGantt from './TimelineGantt';

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
      let startDate = parseISO(data.start_date);
      // Si la fecha de inicio es fin de semana, mover al siguiente día hábil
      while (isWeekend(startDate)) {
        startDate = addDays(startDate, 1);
      }
      const endDate = addBusinessDays(startDate, data.duration - 1);
      return base44.entities.ScheduleTask.create({
        ...data,
        start_date: format(startDate, 'yyyy-MM-dd'),
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
        let startDate = parseISO(data.start_date);
        // Si la fecha de inicio es fin de semana, mover al siguiente día hábil
        while (isWeekend(startDate)) {
          startDate = addDays(startDate, 1);
        }
        const endDate = addBusinessDays(startDate, data.duration - 1);
        data.start_date = format(startDate, 'yyyy-MM-dd');
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

  const bulkCreateTasksMutation = useMutation({
    mutationFn: async (tasksData) => {
      const promises = tasksData.map(task => base44.entities.ScheduleTask.create(task));
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-tasks', projectId] });
      toast.success('Tareas importadas correctamente');
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

  const dateRange = useMemo(() => {
    if (tasks.length === 0) {
      return { 
        start: currentWeekStart, 
        end: endOfWeek(currentWeekStart, { weekStartsOn: 1 }) 
      };
    }
    
    const dates = tasks.flatMap(t => [
      parseISO(t.start_date),
      parseISO(t.end_date || t.start_date)
    ]);
    
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    return {
      start: startOfWeek(minDate, { weekStartsOn: 1 }),
      end: endOfWeek(maxDate, { weekStartsOn: 1 })
    };
  }, [tasks, currentWeekStart]);

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

  const handleImportComplete = async (tasksToImport) => {
    await bulkCreateTasksMutation.mutateAsync(tasksToImport);
  };

  const handleDragUpdate = (taskId, updates) => {
    updateTaskMutation.mutate({ id: taskId, data: updates });
  };

  const exportToExcel = () => {
    const worksheetData = [
      ['CRONOGRAMA DEL PROYECTO', project?.name || ''],
      ['Exportado el', format(new Date(), 'dd/MM/yyyy HH:mm')],
      [],
      ['TAREA', 'ÁREA', 'ASIGNADO A', 'PROGRESO', 'INICIO', 'FIN', 'DÍAS']
    ];

    tasks
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
      .forEach(task => {
        const progress = task.status === 'completed' ? '100%' : 
                        task.status === 'in_progress' ? '50%' : '0%';
        worksheetData.push([
          task.name,
          AREA_NAMES[task.area],
          task.assigned_to || '',
          progress,
          format(parseISO(task.start_date), 'dd/MM/yyyy'),
          format(parseISO(task.end_date), 'dd/MM/yyyy'),
          task.duration
        ]);
      });

    worksheetData.push([]);
    worksheetData.push(['RESUMEN POR ÁREA']);
    worksheetData.push(['Área', 'Total Días', 'Total Tareas']);
    Object.entries(areaBreakdown).forEach(([area, days]) => {
      const taskCount = tasks.filter(t => t.area === area).length;
      worksheetData.push([AREA_NAMES[area], days, taskCount]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cronograma');

    // Estilos de columna
    worksheet['!cols'] = [
      { wch: 35 },  // TAREA
      { wch: 15 },  // ÁREA
      { wch: 25 },  // ASIGNADO A
      { wch: 10 },  // PROGRESO
      { wch: 12 },  // INICIO
      { wch: 12 },  // FIN
      { wch: 8 }    // DÍAS
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
        <Card className="border-[var(--border-primary)] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">Total de Tareas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[var(--text-primary)]">{tasks.length}</div>
          </CardContent>
        </Card>

        <Card className="border-[var(--border-primary)] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">Duración Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[var(--text-primary)]">{totalDuration} <span className="text-lg font-normal text-[var(--text-secondary)]">días</span></div>
          </CardContent>
        </Card>

        <Card className="border-[var(--border-primary)] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">Áreas Involucradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[var(--text-primary)]">{Object.keys(areaBreakdown).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Desglose por área */}
      <Card className="border-[var(--border-primary)] shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Tiempo por Área</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(areaBreakdown).map(([area, days]) => (
              <Badge key={area} variant="outline" className="px-3 py-1.5 font-medium">
                <div className={`w-2.5 h-2.5 rounded-full ${AREA_COLORS[area]} mr-2`} />
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
          <ExcelImportButton 
            projectId={projectId}
            existingTasks={tasks}
            onImportComplete={handleImportComplete}
          />
          <Button variant="outline" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tarea
          </Button>
        </div>
      </div>

      {/* Vista Timeline Gantt Mejorada */}
      <Card className="border-[var(--border-primary)] shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Timeline Interactivo</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <TimelineGantt
            tasks={tasks}
            dateRange={dateRange}
            onUpdateTask={handleDragUpdate}
            onEditTask={setEditingTask}
          />
        </CardContent>
      </Card>

      {/* Lista de tareas */}
      <Card className="border-[var(--border-primary)] shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Todas las Tareas</CardTitle>
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