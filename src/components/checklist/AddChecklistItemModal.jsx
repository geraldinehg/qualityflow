import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';
import { WEIGHT_CONFIG, PHASES } from './checklistTemplates';

export default function AddChecklistItemModal({ phase, projectId, isOpen, onClose, onCreate, isLoading }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    weight: 'medium',
    order: 999
  });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({
      ...formData,
      project_id: projectId,
      phase: phase,
      status: 'pending',
      applicable_technologies: ['all'],
      applicable_site_types: ['all']
    });
  };
  
  const handleClose = () => {
    setFormData({ title: '', description: '', weight: 'medium', order: 999 });
    onClose();
  };
  
  const isValid = formData.title.trim();
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Agregar ítem a {PHASES[phase]?.name}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: Validar formulario de contacto"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción detallada del ítem..."
              className="h-20"
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
                        <div className={`w-2 h-2 rounded-full ${config.color.split(' ')[0]}`} />
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
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 999 })}
              />
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            💡 Este ítem se agregará solo a este proyecto. Los nuevos proyectos usarán la plantilla estándar.
          </div>
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isValid || isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Agregar Ítem
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}