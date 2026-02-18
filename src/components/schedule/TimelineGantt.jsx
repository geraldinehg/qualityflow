import React, { useState, useRef, useEffect } from 'react';
import { format, eachDayOfInterval, isSameDay, parseISO, differenceInDays, isWeekend, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Edit2, GripHorizontal } from 'lucide-react';
import { Button } from "@/components/ui/button";

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

export default function TimelineGantt({ tasks, dateRange, onUpdateTask, onEditTask }) {
  const [draggingState, setDraggingState] = useState(null);
  const containerRef = useRef(null);

  const days = eachDayOfInterval({
    start: dateRange.start,
    end: dateRange.end
  });

  const dayWidth = 80; // px por día
  const totalDays = days.length;

  const getTaskBarStyle = (task) => {
    const startDate = parseISO(task.start_date);
    const endDate = parseISO(task.end_date);
    
    const startOffset = differenceInDays(startDate, dateRange.start);
    const duration = differenceInDays(endDate, startDate) + 1;
    
    return {
      left: `${startOffset * dayWidth}px`,
      width: `${duration * dayWidth}px`
    };
  };

  const handleMouseDown = (e, task, mode) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const barStyle = getTaskBarStyle(task);
    const initialLeft = parseInt(barStyle.left);
    const initialWidth = parseInt(barStyle.width);
    
    setDraggingState({
      taskId: task.id,
      mode, // 'move', 'resize-left', 'resize-right'
      startX,
      initialLeft,
      initialWidth,
      task
    });
  };

  useEffect(() => {
    if (!draggingState) return;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - draggingState.startX;
      const deltaDays = Math.round(deltaX / dayWidth);
      
      if (deltaDays === 0) return;

      let newStartDate = parseISO(draggingState.task.start_date);
      let newEndDate = parseISO(draggingState.task.end_date);
      
      if (draggingState.mode === 'move') {
        // Mover toda la barra
        newStartDate = addDays(newStartDate, deltaDays);
        newEndDate = addDays(newEndDate, deltaDays);
      } else if (draggingState.mode === 'resize-left') {
        // Ajustar inicio
        newStartDate = addDays(newStartDate, deltaDays);
        if (newStartDate >= newEndDate) {
          newStartDate = addDays(newEndDate, -1);
        }
      } else if (draggingState.mode === 'resize-right') {
        // Ajustar fin
        newEndDate = addDays(newEndDate, deltaDays);
        if (newEndDate <= newStartDate) {
          newEndDate = addDays(newStartDate, 1);
        }
      }

      // Actualizar visualmente (temporal)
      const bar = document.getElementById(`task-bar-${draggingState.taskId}`);
      if (bar) {
        const startOffset = differenceInDays(newStartDate, dateRange.start);
        const duration = differenceInDays(newEndDate, newStartDate) + 1;
        bar.style.transform = `translateX(${startOffset * dayWidth - draggingState.initialLeft}px)`;
        if (draggingState.mode !== 'move') {
          bar.style.width = `${duration * dayWidth}px`;
        }
      }
    };

    const handleMouseUp = () => {
      if (!draggingState) return;

      // Calcular nueva posición final
      const bar = document.getElementById(`task-bar-${draggingState.taskId}`);
      const transform = bar?.style.transform || '';
      const match = transform.match(/translateX\((.+?)px\)/);
      const translateX = match ? parseFloat(match[1]) : 0;
      
      const totalOffset = draggingState.initialLeft + translateX;
      const newStartOffset = Math.round(totalOffset / dayWidth);
      const newStartDate = addDays(dateRange.start, newStartOffset);
      
      let newEndDate;
      if (draggingState.mode === 'move') {
        const originalDuration = differenceInDays(
          parseISO(draggingState.task.end_date),
          parseISO(draggingState.task.start_date)
        );
        newEndDate = addDays(newStartDate, originalDuration);
      } else {
        const newWidth = parseInt(bar?.style.width || '0');
        const newDuration = Math.max(1, Math.round(newWidth / dayWidth));
        newEndDate = addDays(newStartDate, newDuration - 1);
      }

      // Enviar actualización al backend
      onUpdateTask(draggingState.taskId, {
        start_date: format(newStartDate, 'yyyy-MM-dd'),
        end_date: format(newEndDate, 'yyyy-MM-dd'),
        duration: differenceInDays(newEndDate, newStartDate) + 1
      });

      setDraggingState(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingState, dayWidth, dateRange, onUpdateTask]);

  return (
    <div className="overflow-x-auto" ref={containerRef}>
      <div style={{ minWidth: `${totalDays * dayWidth + 300}px` }}>
        {/* Header de días */}
        <div className="flex sticky top-0 z-10 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)]">
          <div className="w-[300px] flex-shrink-0 p-3 font-semibold text-sm text-[var(--text-primary)] border-r border-[var(--border-primary)]">
            TAREA
          </div>
          <div className="flex">
            {days.map(day => {
              const isWeekendDay = isWeekend(day);
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toString()}
                  style={{ width: `${dayWidth}px` }}
                  className={`flex-shrink-0 p-2 text-center border-r border-[var(--border-primary)] ${
                    isToday ? 'bg-[#FF1B7E]/10' : isWeekendDay ? 'bg-gray-100/50' : ''
                  }`}
                >
                  <div className={`text-xs uppercase ${isWeekendDay ? 'text-gray-400' : 'text-[var(--text-secondary)]'}`}>
                    {format(day, 'EEE', { locale: es })}
                  </div>
                  <div className={`text-sm font-semibold ${isWeekendDay ? 'text-gray-400' : 'text-[var(--text-primary)]'}`}>
                    {format(day, 'd')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filas de tareas */}
        {tasks.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-secondary)]">
            No hay tareas en el cronograma
          </div>
        ) : (
          tasks.map(task => {
            const barStyle = getTaskBarStyle(task);
            const isDragging = draggingState?.taskId === task.id;

            return (
              <div
                key={task.id}
                className="flex border-b border-[var(--border-primary)] hover:bg-[var(--bg-hover)] group"
              >
                {/* Columna de nombre */}
                <div className="w-[300px] flex-shrink-0 p-3 border-r border-[var(--border-primary)] flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={`w-2 h-2 rounded-full ${AREA_COLORS[task.area]} flex-shrink-0`} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {task.name}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)]">
                        {AREA_NAMES[task.area]} • {task.duration}d
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={() => onEditTask(task)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </div>

                {/* Timeline */}
                <div className="relative flex-1" style={{ height: '60px' }}>
                  <div
                    id={`task-bar-${task.id}`}
                    className={`absolute top-1/2 -translate-y-1/2 h-8 ${AREA_COLORS[task.area]} rounded-lg opacity-80 hover:opacity-100 transition-all cursor-move flex items-center px-2 text-white text-xs font-medium ${
                      isDragging ? 'shadow-lg scale-105' : ''
                    }`}
                    style={barStyle}
                    onMouseDown={(e) => handleMouseDown(e, task, 'move')}
                  >
                    {/* Handle izquierdo - ajustar inicio */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                      onMouseDown={(e) => handleMouseDown(e, task, 'resize-left')}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <GripHorizontal className="h-3 w-3" />
                    </div>

                    {/* Contenido */}
                    <span className="truncate flex-1 text-center">
                      {task.name}
                    </span>

                    {/* Handle derecho - ajustar fin */}
                    <div
                      className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                      onMouseDown={(e) => handleMouseDown(e, task, 'resize-right')}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <GripHorizontal className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}