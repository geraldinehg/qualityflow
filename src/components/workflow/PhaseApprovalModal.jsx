import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from 'lucide-react';

export default function PhaseApprovalModal({ phase, phaseKey, isOpen, onClose, onApprove }) {
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async () => {
    if (!phaseKey) return;
    
    setIsLoading(true);
    try {
      await onApprove(phaseKey, notes);
      setNotes('');
    } catch (error) {
      console.error('Error in modal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!phase) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Aprobar Fase
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <p className="text-sm text-slate-600">
              Estás aprobando la fase:
            </p>
            <p className="font-semibold text-slate-900 mt-1">
              {phase.name}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Notas de Aprobación (Opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Agrega comentarios sobre esta aprobación..."
              className="h-24"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleApprove} disabled={isLoading}>
            {isLoading ? 'Aprobando...' : 'Aprobar Fase'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}