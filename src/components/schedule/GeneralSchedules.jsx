import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const PHASES = [
  { key: 'activation', name: 'Activación', color: 'bg-purple-500' },
  { key: 'planning', name: 'Planeación', color: 'bg-blue-500' },
  { key: 'design', name: 'Diseño', color: 'bg-pink-500' },
  { key: 'web_development', name: 'Desarrollo Web', color: 'bg-orange-500' },
  { key: 'development', name: 'Desarrollo', color: 'bg-cyan-500' },
  { key: 'qa_complete', name: 'QA Completo', color: 'bg-green-500' },
  { key: 'content_upload', name: 'Carga de Contenido', color: 'bg-yellow-500' },
  { key: 'final_approval', name: 'Aprobación Final', color: 'bg-red-500' },
  { key: 'stabilization', name: 'Estabilización', color: 'bg-teal-500' }
];

export default function GeneralSchedules() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date')
  });

  // Filtrar proyectos activos con fecha de inicio
  const activeProjects = projects.filter(p => 
    p.start_date && 
    (p.status === 'in_progress' || p.status === 'review')
  );

  // Calcular eventos del calendario para todos los proyectos
  const calendarEvents = useMemo(() => {
    const events = [];
    
    activeProjects.forEach(project => {
      if (!project.start_date || !project.phase_durations) return;
      
      let currentDate = parseISO(project.start_date);
      
      PHASES.forEach(phase => {
        const duration = project.phase_durations?.[phase.key] || 0;
        if (duration > 0) {
          const endDate = addDays(currentDate, duration - 1);
          events.push({
            projectId: project.id,
            projectName: project.name,
            phase: phase.key,
            phaseName: phase.name,
            color: phase.color,
            startDate: new Date(currentDate),
            endDate: new Date(endDate)
          });
          currentDate = addDays(endDate, 1);
        }
      });
    });
    
    return events;
  }, [activeProjects]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startPadding = monthStart.getDay();
  const paddingDays = Array(startPadding).fill(null);

  const getEventsForDay = (date) => {
    return calendarEvents.filter(event => {
      return date >= event.startDate && date <= event.endDate;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="border-[var(--border-secondary)] text-[var(--text-secondary)]">
          {activeProjects.length} proyectos activos
        </Badge>
      </div>

      {activeProjects.length === 0 ? (
        <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
          <CardContent className="py-12 text-center">
            <CalendarIcon className="h-12 w-12 text-[var(--text-tertiary)] mx-auto mb-4" />
            <p className="text-[var(--text-secondary)]">No hay proyectos con cronogramas definidos</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Navegación del calendario */}
          <div className="flex items-center justify-between bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="bg-white text-black hover:bg-gray-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="bg-white text-black hover:bg-gray-100"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendario */}
          <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
            <CardContent className="p-4">
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                  <div key={day} className="text-center text-xs font-semibold text-[var(--text-secondary)] py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {paddingDays.map((_, index) => (
                  <div key={`padding-${index}`} className="aspect-square" />
                ))}
                
                {daysInMonth.map((day) => {
                  const dayEvents = getEventsForDay(day);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div
                      key={day.toString()}
                      className={`aspect-square border rounded-lg p-1 relative overflow-hidden ${
                        isToday ? 'border-[#FF1B7E] bg-[#FF1B7E]/10' : 'border-[var(--border-primary)] bg-[var(--bg-primary)]'
                      }`}
                    >
                      <div className="text-xs font-medium text-[var(--text-primary)] mb-1">
                        {format(day, 'd')}
                      </div>
                      
                      {dayEvents.length > 0 && (
                        <div className="space-y-0.5">
                          {dayEvents.slice(0, 3).map((event, idx) => (
                            <div
                              key={idx}
                              className={`text-[10px] ${event.color} text-white px-1 py-0.5 rounded truncate`}
                              title={`${event.projectName} - ${event.phaseName}`}
                            >
                              {event.projectName}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-[10px] text-[var(--text-secondary)] px-1">
                              +{dayEvents.length - 3} más
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Lista de proyectos activos */}
          <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
            <CardHeader>
              <CardTitle className="text-base text-[var(--text-primary)]">Proyectos Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeProjects.map(project => (
                  <Link 
                    key={project.id} 
                    to={`${createPageUrl('ProjectChecklist')}?id=${project.id}`}
                    className="block"
                  >
                    <div className="border border-[var(--border-primary)] rounded-lg p-3 hover:border-[#FF1B7E]/40 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-[var(--text-primary)]">{project.name}</h4>
                        <Badge variant="outline" className="border-[var(--border-secondary)] text-[var(--text-secondary)] text-xs">
                          {project.current_workflow_phase || 'Sin fase'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
                        <span>Inicio: {format(parseISO(project.start_date), 'd MMM yyyy', { locale: es })}</span>
                        {project.target_date && (
                          <span>Entrega: {format(parseISO(project.target_date), 'd MMM yyyy', { locale: es })}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}