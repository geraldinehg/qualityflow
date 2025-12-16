import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, RotateCcw } from 'lucide-react';
import { PHASES } from './checklistTemplates';

export default function EditPhaseModal({ phase, currentName, isOpen, onClose, onSave, isLoading }) {
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Editar nombre de fase</DialogTitle>
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
              className="w-full"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar nombre original
            </Button>
          )}
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            💡 Este cambio solo afecta a este proyecto. Otros proyectos mantendrán el nombre por defecto.
          </div>
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isValid || isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}