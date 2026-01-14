import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const AREAS = [
  { value: 'creativity', label: 'Creatividad' },
  { value: 'software', label: 'Software' },
  { value: 'seo', label: 'SEO' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'paid', label: 'Paid Media' },
  { value: 'social', label: 'Social Media' },
  { value: 'product', label: 'Producto' },
  { value: 'qa', label: 'QA' }
];

const STATUSES = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'in_progress', label: 'En progreso' },
  { value: 'completed', label: 'Completada' },
  { value: 'blocked', label: 'Bloqueada' }
];

export default function EditScheduleTaskModal({ task, isOpen, onClose, onSave, onDelete, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    area: 'software',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    duration: 5,
    status: 'pending',
    assigned_to: '',
    notes: ''
  });

  useEffect(() => {
    if (task) {
      setFormData({
        name: task.name || '',
        area: task.area || 'software',
        start_date: task.start_date || format(new Date(), 'yyyy-MM-dd'),
        duration: task.duration || 5,
        status: task.status || 'pending',
        assigned_to: task.assigned_to || '',
        notes: task.notes || ''
      });
    } else {
      setFormData({
        name: '',
        area: 'software',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        duration: 5,
        status: 'pending',
        assigned_to: '',
        notes: ''
      });
    }
  }, [task, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de eliminar esta tarea del cronograma?')) {
      onDelete(task.id);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-[var(--bg-secondary)] border-[var(--border-primary)]">
        <DialogHeader>
          <DialogTitle className="text-[var(--text-primary)]">
            {task ? 'Editar Tarea del Cronograma' : 'Nueva Tarea del Cronograma'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[var(--text-primary)]">Nombre de la tarea *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Diseño de interfaces"
              required
              className="bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-primary)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="area" className="text-[var(--text-primary)]">Área *</Label>
              <Select value={formData.area} onValueChange={(value) => setFormData({ ...formData, area: value })}>
                <SelectTrigger className="bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-primary)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AREAS.map(area => (
                    <SelectItem key={area.value} value={area.value}>
                      {area.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-[var(--text-primary)]">Estado</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-primary)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date" className="text-[var(--text-primary)]">Fecha de inicio *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
                className="bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-primary)]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration" className="text-[var(--text-primary)]">Duración (días) *</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                required
                className="bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-primary)]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_to" className="text-[var(--text-primary)]">Responsable (email)</Label>
            <Input
              id="assigned_to"
              type="email"
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              placeholder="email@ejemplo.com"
              className="bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-primary)]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-[var(--text-primary)]">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas adicionales sobre la tarea..."
              rows={3}
              className="bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-primary)]"
            />
          </div>

          <DialogFooter className="flex justify-between items-center">
            <div>
              {task && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="bg-[#FF1B7E] hover:bg-[#e6156e] text-white">
                {isLoading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}