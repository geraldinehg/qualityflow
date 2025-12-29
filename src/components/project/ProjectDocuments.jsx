import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileText, Upload, Trash2, Download, Loader2, Plus } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const DOCUMENT_TYPES = {
  propuesta: { label: 'Propuesta', color: 'bg-blue-100 text-blue-700' },
  cronograma: { label: 'Cronograma', color: 'bg-purple-100 text-purple-700' },
  planeacion: { label: 'Planeación', color: 'bg-green-100 text-green-700' },
  brief: { label: 'Brief', color: 'bg-amber-100 text-amber-700' },
  hoja_vida: { label: 'Hoja de Vida', color: 'bg-pink-100 text-pink-700' },
  otro: { label: 'Otro', color: 'bg-slate-100 text-slate-700' }
};

export default function ProjectDocuments({ projectId }) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    document_type: 'otro',
    notes: '',
    file: null
  });

  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['project-documents', projectId],
    queryFn: () => base44.entities.ProjectDocument.filter({ project_id: projectId }),
    enabled: !!projectId
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProjectDocument.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-documents', projectId] });
      toast.success('Documento eliminado');
    }
  });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, file, name: formData.name || file.name });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.file) return;

    setUploading(true);
    try {
      const user = await base44.auth.me();
      const { file_url } = await base44.integrations.Core.UploadFile({ file: formData.file });
      
      await base44.entities.ProjectDocument.create({
        project_id: projectId,
        name: formData.name,
        document_type: formData.document_type,
        file_url: file_url,
        uploaded_by: user.email,
        notes: formData.notes
      });

      queryClient.invalidateQueries({ queryKey: ['project-documents', projectId] });
      toast.success('Documento subido correctamente');
      setIsUploadOpen(false);
      setFormData({ name: '', document_type: 'otro', notes: '', file: null });
    } catch (error) {
      toast.error('Error al subir el documento');
    } finally {
      setUploading(false);
    }
  };

  const groupedDocs = documents.reduce((acc, doc) => {
    if (!acc[doc.document_type]) acc[doc.document_type] = [];
    acc[doc.document_type].push(doc);
    return acc;
  }, {});

  return (
    <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2 text-white">
            <FileText className="h-5 w-5 text-[#FF1B7E]" />
            Documentación del Proyecto
          </CardTitle>
          <Button size="sm" onClick={() => setIsUploadOpen(true)} className="bg-white hover:bg-gray-100 text-black">
            <Plus className="h-4 w-4 mr-2" />
            Subir Documento
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <FileText className="h-12 w-12 mx-auto mb-2 text-gray-600" />
            <p className="text-sm">No hay documentos subidos</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedDocs).map(([type, docs]) => (
              <div key={type}>
                <h4 className="text-sm font-medium text-white mb-2">
                  {DOCUMENT_TYPES[type]?.label}
                </h4>
                <div className="space-y-2">
                  {docs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg hover:bg-[#2a2a2a]/50 transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-white truncate">{doc.name}</p>
                          <p className="text-xs text-gray-400">
                            Subido por {doc.uploaded_by} • {format(new Date(doc.created_date), "d MMM yyyy", { locale: es })}
                          </p>
                          {doc.notes && (
                            <p className="text-xs text-gray-300 mt-1">{doc.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => window.open(doc.file_url, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => {
                            if (confirm('¿Eliminar este documento?')) {
                              deleteMutation.mutate(doc.id);
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
        )}

        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Subir Documento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Documento *</Label>
                <Select
                  value={formData.document_type}
                  onValueChange={(value) => setFormData({ ...formData, document_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DOCUMENT_TYPES).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nombre del Documento *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Propuesta Final v2"
                />
              </div>

              <div className="space-y-2">
                <Label>Archivo *</Label>
                <Input
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.png"
                />
                <p className="text-xs text-slate-500">
                  Formatos permitidos: PDF, Word, Excel, PowerPoint, Imágenes
                </p>
              </div>

              <div className="space-y-2">
                <Label>Notas (Opcional)</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notas adicionales sobre el documento"
                  className="h-20"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)} className="border-white hover:bg-gray-100 text-white hover:text-black">
                  Cancelar
                </Button>
                <Button type="submit" disabled={!formData.name || !formData.file || uploading} className="bg-white hover:bg-gray-100 text-black">
                  {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Subir
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}