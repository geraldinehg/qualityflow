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
      <DialogContent className="sm:max-w-lg bg-[#1a1a1a] border-[#2a2a2a] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">Editar ítem del checklist</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-gray-300">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: Imágenes optimizadas"
              className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#FF1B7E]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-300">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción detallada del ítem..."
              className="h-20 bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#FF1B7E]"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioridad *</Label>
              <Select
                value={formData.weight}
                onValueChange={(value) => setFormData({ ...formData, weight: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
              <Label htmlFor="order">Orden</Label>
              <Input
                id="order"
                type="number"
                min="1"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
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
              <Button type="button" variant="outline" onClick={handleClose} className="border-white hover:bg-gray-100 text-white hover:text-black">
                Cancelar
              </Button>
              <Button type="submit" disabled={!isValid || isLoading} className="bg-white hover:bg-gray-100 text-black">
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