import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from "@/lib/utils";

const PHASES = [
  { key: 'requirements', name: 'Requerimientos', color: 'bg-blue-500' },
  { key: 'architecture', name: 'Arquitectura', color: 'bg-indigo-500' },
  { key: 'design', name: 'Diseño', color: 'bg-purple-500' },
  { key: 'development', name: 'Desarrollo', color: 'bg-green-500' },
  { key: 'performance', name: 'Performance', color: 'bg-yellow-500' },
  { key: 'seo_accessibility', name: 'SEO y Accesibilidad', color: 'bg-orange-500' },
  { key: 'responsive', name: 'Responsive', color: 'bg-pink-500' },
  { key: 'qa', name: 'QA', color: 'bg-red-500' },
  { key: 'security', name: 'Seguridad', color: 'bg-slate-500' },
  { key: 'delivery', name: 'Entrega', color: 'bg-emerald-500' }
];

export default function ProjectCalendar({ project, onUpdatePhaseDurations }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [phaseDurations, setPhaseDurations] = useState(
    project.phase_durations || PHASES.reduce((acc, phase) => ({ ...acc, [phase.key]: 5 }), {})
  );

  // Calcular fechas de cada fase
  const phaseSchedule = useMemo(() => {
    if (!project.start_date) return [];
    
    const schedule = [];
    let currentDate = parseISO(project.start_date);
    
    PHASES.forEach(phase => {
      const duration = phaseDurations[phase.key] || 5;
      const endDate = addDays(currentDate, duration - 1);
      
      schedule.push({
        ...phase,
        startDate: currentDate,
        endDate: endDate,
        duration
      });
      
      currentDate = addDays(endDate, 1);
    });
    
    return schedule;
  }, [project.start_date, phaseDurations]);

  // Días del mes actual
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const handleDurationChange = (phaseKey, value) => {
    const duration = parseInt(value) || 0;
    if (duration > 0 && duration <= 90) {
      setPhaseDurations(prev => ({ ...prev, [phaseKey]: duration }));
    }
  };

  const handleSave = () => {
    onUpdatePhaseDurations(phaseDurations);
  };

  const getPhaseForDay = (day) => {
    return phaseSchedule.find(phase => {
      const dayTime = day.getTime();
      const startTime = phase.startDate.getTime();
      const endTime = phase.endDate.getTime();
      return dayTime >= startTime && dayTime <= endTime;
    });
  };

  return (
    <div className="space-y-6">
      {/* Configuración de duraciones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Configuración de Fases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {PHASES.map(phase => (
              <div key={phase.key} className="space-y-2">
                <Label className="text-xs">{phase.name}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="90"
                    value={phaseDurations[phase.key] || 5}
                    onChange={(e) => handleDurationChange(phase.key, e.target.value)}
                    className="h-8"
                  />
                  <span className="text-xs text-slate-500">días</span>
                </div>
              </div>
            ))}
          </div>
          <Button onClick={handleSave} className="mt-4" size="sm">
            Guardar Configuración
          </Button>
        </CardContent>
      </Card>

      {/* Vista de calendario */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Cronograma del Proyecto
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(addDays(currentMonth, -30))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[150px] text-center">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(addDays(currentMonth, 30))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!project.start_date ? (
            <div className="text-center py-8 text-slate-500">
              Define una fecha de inicio en la configuración del proyecto para ver el cronograma
            </div>
          ) : (
            <div className="space-y-4">
              {/* Leyenda de fases */}
              <div className="flex flex-wrap gap-2 pb-4 border-b">
                {phaseSchedule.map(phase => (
                  <div key={phase.key} className="flex items-center gap-2 text-xs">
                    <div className={cn("w-3 h-3 rounded", phase.color)} />
                    <span className="text-slate-700">{phase.name}</span>
                    <span className="text-slate-500">
                      ({format(phase.startDate, 'd MMM', { locale: es })} - {format(phase.endDate, 'd MMM', { locale: es })})
                    </span>
                  </div>
                ))}
              </div>

              {/* Calendario */}
              <div className="grid grid-cols-7 gap-1">
                {/* Días de la semana */}
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                  <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
                    {day}
                  </div>
                ))}
                
                {/* Días del mes */}
                {monthDays.map(day => {
                  const phase = getPhaseForDay(day);
                  const isToday = isSameDay(day, new Date());
                  
                  return (
                    <div
                      key={day.toString()}
                      className={cn(
                        "aspect-square p-1 border rounded-lg text-center flex flex-col items-center justify-center",
                        !isSameMonth(day, currentMonth) && "opacity-30",
                        isToday && "ring-2 ring-blue-400",
                        phase && phase.color
                      )}
                    >
                      <span className={cn(
                        "text-xs font-medium",
                        phase ? "text-white" : "text-slate-700"
                      )}>
                        {format(day, 'd')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumen de fechas */}
      {project.start_date && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumen de Fases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {phaseSchedule.map(phase => (
                <div key={phase.key} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-3 h-3 rounded", phase.color)} />
                    <span className="font-medium text-sm">{phase.name}</span>
                  </div>
                  <div className="text-sm text-slate-600">
                    {format(phase.startDate, 'd MMM', { locale: es })} - {format(phase.endDate, 'd MMM yyyy', { locale: es })}
                    <span className="text-slate-400 ml-2">({phase.duration} días)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}