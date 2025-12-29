import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, RotateCcw, Trash2 } from 'lucide-react';
import { PHASES } from './checklistTemplates';

export default function EditPhaseModal({ phase, currentName, isOpen, onClose, onSave, onDelete, isLoading }) {
  const [customName, setCustomName] = useState('');
  const defaultName = PHASES[phase]?.name || '';
  
  useEffect(() => {
    if (isOpen) {
      setCustomName(currentName || defaultName);
    }
  }, [isOpen, currentName, defaultName]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(phase, customName);
  };
  
  const handleReset = () => {
    setCustomName(defaultName);
  };
  
  const handleClose = () => {
    setCustomName('');
    onClose();
  };
  
  const hasChanged = customName !== defaultName;
  const isValid = customName.trim();
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-[#1a1a1a] border-[#2a2a2a] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">Editar nombre de fase</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="phaseName">Nombre de la fase</Label>
            <Input
              id="phaseName"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={defaultName}
            />
            <p className="text-xs text-slate-500">
              Nombre por defecto: <strong>{defaultName}</strong>
            </p>
          </div>
          
          {hasChanged && (
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={handleReset}
              className="w-full border-white hover:bg-gray-100 text-white hover:text-black"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar nombre original
            </Button>
          )}
          
          <div className="bg-[#FF1B7E]/10 border border-[#FF1B7E]/30 rounded-lg p-3 text-sm text-[#FF1B7E]">
            💡 Este cambio solo afecta a este proyecto. Otros proyectos mantendrán el nombre por defecto.
          </div>
          
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-400">
            <strong>⚠️ Eliminar fase:</strong> Al eliminar una fase, esta se ocultará pero los ítems del checklist se conservarán y podrás restaurarla más tarde.
          </div>
          
          <DialogFooter className="mt-6 flex justify-between">
            <Button 
              type="button" 
              variant="destructive" 
              onClick={() => onDelete && onDelete(phase)}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar Fase
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleClose} className="border-white hover:bg-gray-100 text-white hover:text-black">
                Cancelar
              </Button>
              <Button type="submit" disabled={!isValid || isLoading} className="bg-white hover:bg-gray-100 text-black">
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Guardar
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}