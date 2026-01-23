import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, AlertTriangle } from 'lucide-react';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export default function EditSchedulePhaseModal({ phase, projectId, onClose }) {
  const [endDate, setEndDate] = useState(phase.end_date);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const queryClient = useQueryClient();

  const daysDiff = differenceInCalendarDays(
    parseISO(endDate),
    parseISO(phase.end_date)
  );

  // Mutación para actualizar fase y recalcular
  const updateMutation = useMutation({
    mutationFn: async () => {
      setIsRecalculating(true);

      // 1. Actualizar la fase
      await base44.entities.SchedulePhase.update(phase.id, {
        end_date: endDate
      });

      // 2. Recalcular dependencias
      const result = await base44.functions.invoke('recalculateSchedule', {
        projectId,
        modifiedPhaseKey: phase.phase_key,
        newEndDate: endDate
      });

      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['schedule-phases', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      
      const { data } = result;
      
      if (data.cascadeCount > 0) {
        toast.success(
          `✅ Cronograma actualizado. ${data.cascadeCount} fase${data.cascadeCount > 1 ? 's' : ''} recalculada${data.cascadeCount > 1 ? 's' : ''} automáticamente`,
          { duration: 4000 }
        );
      } else {
        toast.success('✅ Fecha actualizada correctamente');
      }
      
      setIsRecalculating(false);
      onClose();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
      setIsRecalculating(false);
    }
  });

  const handleSave = () => {
    if (endDate === phase.end_date) {
      onClose();
      return;
    }
    updateMutation.mutate();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
        <DialogHeader>
          <DialogTitle className="text-[var(--text-primary)]">
            Editar fase: {phase.phase_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-[var(--text-secondary)] mb-2 block">
              Fecha de inicio
            </label>
            <Input
              value={format(parseISO(phase.start_date), "d 'de' MMMM, yyyy", { locale: es })}
              disabled
              className="bg-[var(--bg-tertiary)]"
            />
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)] mb-2 block">
              Fecha de fin
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(parseISO(endDate), "d 'de' MMMM, yyyy", { locale: es })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={parseISO(endDate)}
                  onSelect={(date) => {
                    if (date) {
                      setEndDate(format(date, 'yyyy-MM-dd'));
                      document.body.click();
                    }
                  }}
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)] mb-2 block">
              Duración
            </label>
            <Input
              value={`${phase.duration_days} días hábiles`}
              disabled
              className="bg-[var(--bg-tertiary)]"
            />
          </div>

          {daysDiff !== 0 && (
            <div className={`p-3 rounded-lg border ${
              daysDiff > 0 
                ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                : 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
            }`}>
              <div className="flex items-start gap-2">
                <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                  daysDiff > 0 ? 'text-yellow-600' : 'text-blue-600'
                }`} />
                <div className="text-xs">
                  <div className={`font-semibold mb-1 ${
                    daysDiff > 0 ? 'text-yellow-800 dark:text-yellow-400' : 'text-blue-800 dark:text-blue-400'
                  }`}>
                    {daysDiff > 0 ? '⚠️ Retraso detectado' : '✓ Adelanto detectado'}
                  </div>
                  <div className="text-[var(--text-secondary)]">
                    Esta fase se {daysDiff > 0 ? 'retrasará' : 'adelantará'} <strong>{Math.abs(daysDiff)} días</strong>.
                    {phase.depends_on?.length > 0 && (
                      <div className="mt-1">
                        Las fases dependientes se recalcularán automáticamente.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {phase.responsible_email && (
            <div className="text-xs text-[var(--text-tertiary)]">
              Responsable: {phase.responsible_email}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isRecalculating}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isRecalculating || endDate === phase.end_date}
            className="bg-[#FF1B7E] hover:bg-[#e6156e]"
          >
            {isRecalculating ? 'Recalculando...' : 'Guardar y recalcular'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}