import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trash2 } from 'lucide-react';
import { WEIGHT_CONFIG } from './checklistTemplates';

export default function EditChecklistItemModal({ item, isOpen, onClose, onSave, onDelete, isLoading }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    weight: 'medium',
    order: 1
  });
  
  // Actualizar formData cuando cambia el item
  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title || '',
        description: item.description || '',
        weight: item.weight || 'medium',
        order: item.order || 1
      });
    }
  }, [item]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };
  
  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de eliminar este ítem del checklist?')) {
      onDelete(item.id);
    }
  };
  
  const handleClose = () => {
    // Resetear el formulario al cerrar
    setFormData({
      title: '',
      description: '',
      weight: 'medium',
      order: 1
    });
    onClose();
  };
  
  const isValid = formData.title.trim();
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-primary)]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[var(--text-primary)]">Editar ítem del checklist</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-[var(--text-primary)]">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: Imágenes optimizadas"
              className="bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-primary)]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-[var(--text-primary)]">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción detallada del ítem..."
              className="h-20 bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-primary)]"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[var(--text-primary)]">Prioridad *</Label>
              <Select
                value={formData.weight}
                onValueChange={(value) => setFormData({ ...formData, weight: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
                  {Object.entries(WEIGHT_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${config.color.split(' ')[0].replace('bg-', 'bg-')}`} />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="order" className="text-[var(--text-primary)]">Orden</Label>
              <Input
                id="order"
                type="number"
                min="1"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                className="bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-primary)]"
              />
            </div>
          </div>
          
          <DialogFooter className="flex justify-between mt-6">
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!isValid || isLoading} className="bg-[#FF1B7E] hover:bg-[#e6156e] text-white">
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Guardar Cambios
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}