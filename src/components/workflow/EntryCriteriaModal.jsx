import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, CheckCircle2, Circle, Upload, Trash2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function EntryCriteriaModal({ projectId, phaseKey, phaseName, isOpen, onClose }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newCriteria, setNewCriteria] = useState({
    title: '',
    description: '',
    area: '',
    is_mandatory: true
  });
  const [uploadingFor, setUploadingFor] = useState(null);

  const queryClient = useQueryClient();

  const { data: criteria = [] } = useQuery({
    queryKey: ['entry-criteria', projectId, phaseKey],
    queryFn: () => base44.entities.EntryCriteria.filter({ project_id: projectId, phase_key: phaseKey }),
    enabled: isOpen && !!projectId && !!phaseKey
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.EntryCriteria.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entry-criteria'] });
      setIsAdding(false);
      setNewCriteria({ title: '', description: '', area: '', is_mandatory: true });
      toast.success('Criterio agregado');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EntryCriteria.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entry-criteria'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EntryCriteria.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entry-criteria'] });
      toast.success('Criterio eliminado');
    }
  });

  const handleCreate = () => {
    if (!newCriteria.title) return;
    createMutation.mutate({
      project_id: projectId,
      phase_key: phaseKey,
      ...newCriteria
    });
  };

  const handleToggleComplete = async (criterion) => {
    const user = await base44.auth.me();
    updateMutation.mutate({
      id: criterion.id,
      data: {
        is_completed: !criterion.is_completed,
        completed_by: !criterion.is_completed ? user.email : null,
        completed_at: !criterion.is_completed ? new Date().toISOString() : null
      }
    });
  };

  const handleUploadDocument = async (criterion, file) => {
    setUploadingFor(criterion.id);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await updateMutation.mutateAsync({
        id: criterion.id,
        data: { document_url: file_url }
      });
      toast.success('Documento adjuntado');
    } catch (error) {
      toast.error('Error al subir documento');
    } finally {
      setUploadingFor(null);
    }
  };

  const mandatoryCriteria = criteria.filter(c => c.is_mandatory);
  const completedMandatory = mandatoryCriteria.filter(c => c.is_completed);
  
  // Agrupar criterios por área
  const criteriaByArea = criteria.reduce((acc, criterion) => {
    const area = criterion.area || 'Sin Área';
    if (!acc[area]) acc[area] = [];
    acc[area].push(criterion);
    return acc;
  }, {});

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Criterios de Entrada - {phaseName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {mandatoryCriteria.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                <strong>Progreso:</strong> {completedMandatory.length} de {mandatoryCriteria.length} criterios obligatorios completados
              </p>
            </div>
          )}

          <div className="space-y-4">
            {Object.entries(criteriaByArea).map(([area, areaCriteria]) => (
              <div key={area} className="space-y-2">
                <h3 className="font-semibold text-sm text-slate-700 bg-slate-100 px-3 py-1.5 rounded">
                  {area}
                </h3>
                <div className="space-y-2">
                  {areaCriteria.map((criterion) => (
              <div key={criterion.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      onClick={() => handleToggleComplete(criterion)}
                      className="mt-1"
                    >
                      {criterion.is_completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-300" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{criterion.title}</p>
                        {criterion.is_mandatory && (
                          <Badge variant="outline" className="text-xs">Obligatorio</Badge>
                        )}
                        {criterion.area && (
                          <Badge variant="secondary" className="text-xs">{criterion.area}</Badge>
                        )}
                      </div>
                      {criterion.description && (
                        <p className="text-xs text-slate-600">{criterion.description}</p>
                      )}
                      {criterion.is_completed && (
                        <p className="text-xs text-slate-500 mt-1">
                          Completado por {criterion.completed_by} • {format(new Date(criterion.completed_at), "d MMM yyyy", { locale: es })}
                        </p>
                      )}
                      {criterion.document_url && (
                        <a
                          href={criterion.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                        >
                          <FileText className="h-3 w-3" />
                          Ver documento adjunto
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <label htmlFor={`upload-${criterion.id}`}>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        asChild
                      >
                        <span>
                          <Upload className="h-4 w-4" />
                        </span>
                      </Button>
                    </label>
                    <input
                      id={`upload-${criterion.id}`}
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) handleUploadDocument(criterion, file);
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-red-600"
                      onClick={() => {
                        if (confirm('¿Eliminar este criterio?')) {
                          deleteMutation.mutate(criterion.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            ))}
          </div>

          {isAdding ? (
            <div className="border rounded-lg p-3 space-y-3 bg-slate-50">
              <div>
                <Label>Título del Criterio *</Label>
                <Input
                  value={newCriteria.title}
                  onChange={(e) => setNewCriteria({ ...newCriteria, title: e.target.value })}
                  placeholder="Ej: Brief de proyecto aprobado"
                />
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={newCriteria.description}
                  onChange={(e) => setNewCriteria({ ...newCriteria, description: e.target.value })}
                  placeholder="Detalles del criterio..."
                  className="h-20"
                />
              </div>
              <div>
                <Label>Área Responsable</Label>
                <Input
                  value={newCriteria.area}
                  onChange={(e) => setNewCriteria({ ...newCriteria, area: e.target.value })}
                  placeholder="Ej: DEV, QA, Producto"
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={newCriteria.is_mandatory}
                  onCheckedChange={(checked) => setNewCriteria({ ...newCriteria, is_mandatory: checked })}
                  id="mandatory"
                />
                <Label htmlFor="mandatory" className="text-sm">Criterio obligatorio</Label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreate} disabled={!newCriteria.title}>
                  Agregar
                </Button>
                <Button variant="outline" onClick={() => setIsAdding(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setIsAdding(true)} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Criterio
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}