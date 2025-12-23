import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from 'lucide-react';

export default function PhaseApprovalModal({ phase, phaseKey, isOpen, onClose, onApprove }) {
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset loading state when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setIsLoading(false);
      setNotes('');
    }
  }, [isOpen]);

  const handleApprove = async () => {
    if (!phaseKey || isLoading) return;
    
    setIsLoading(true);
    try {
      await onApprove(phaseKey, notes);
      setNotes('');
      onClose();
    } catch (error) {
      console.error('Error in modal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!phase) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Aprobar Fase
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <p className="text-sm text-gray-400">
              Estás aprobando la fase:
            </p>
            <p className="font-semibold text-white mt-1">
              {phase.name}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Notas de Aprobación (Opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Agrega comentarios sobre esta aprobación..."
              className="h-24 bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#FF1B7E]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose} 
            disabled={isLoading} 
            className="border-[#2a2a2a] hover:bg-[#2a2a2a] text-white hover:text-white"
          >
            Cancelar
          </Button>
          <Button 
            type="button" 
            onClick={handleApprove} 
            disabled={isLoading} 
            className="bg-[#FF1B7E] hover:bg-[#e6156e] text-white"
          >
            {isLoading ? 'Aprobando...' : 'Aprobar Fase'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}