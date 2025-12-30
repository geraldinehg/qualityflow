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
import { FileText, Upload, Trash2, Download, Loader2, Plus, ExternalLink } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import GoogleDrivePicker from '../googledrive/GoogleDrivePicker';
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
  const [showGoogleDrivePicker, setShowGoogleDrivePicker] = useState(false);
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
    <Card className="bg-gradient-to-br from-[#1a1a1a] to-[#141414] border-[#2a2a2a] shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-3 text-white">
            <div className="w-10 h-10 rounded-xl bg-[#FF1B7E]/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-[#FF1B7E]" />
            </div>
            Documentación del Proyecto
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button
            size="sm"
            onClick={() => setShowGoogleDrivePicker(true)}
            className="bg-gradient-to-r from-[#4285F4] to-[#34A853] hover:from-[#3367D6] hover:to-[#2D8E47] text-white border-0 shadow-lg"
          >
            <FileText className="h-4 w-4 mr-2" />
            Google Drive
          </Button>
          <Button
            size="sm"
            onClick={() => setIsUploadOpen(true)}
            className="bg-white hover:bg-gray-100 text-black border-white shadow-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            Subir Archivo
          </Button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF1B7E] mb-3" />
            <p className="text-sm text-gray-400">Cargando documentos...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-[#2a2a2a] rounded-xl bg-[#0a0a0a]/50">
            <div className="w-20 h-20 rounded-full bg-[#2a2a2a]/30 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-10 w-10 text-gray-600" />
            </div>
            <p className="text-sm font-medium text-gray-300 mb-1">No hay documentos subidos</p>
            <p className="text-xs text-gray-500">Sube archivos o vincula desde Google Drive</p>
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
                          title={doc.file_url.includes('drive.google.com') ? 'Ver en Google Drive' : 'Descargar'}
                        >
                          {doc.file_url.includes('drive.google.com') ? (
                            <ExternalLink className="h-4 w-4" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
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
          <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Subir Documento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Tipo de Documento *</Label>
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
                <Label className="text-white">Nombre del Documento *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Propuesta Final v2"
                  className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Archivo *</Label>
                <Input
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.png"
                  className="bg-[#0a0a0a] border-[#2a2a2a] text-white"
                />
                <p className="text-xs text-gray-400">
                  Formatos permitidos: PDF, Word, Excel, PowerPoint, Imágenes
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Notas (Opcional)</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notas adicionales sobre el documento"
                  className="h-20 bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500"
                />
              </div>

              <DialogFooter>
                <Button type="button" onClick={() => setIsUploadOpen(false)} className="bg-white hover:bg-gray-100 text-black border-white">
                  Cancelar
                </Button>
                <Button type="submit" disabled={!formData.name || !formData.file || uploading} className="bg-[#FF1B7E] hover:bg-[#e6156e] text-white">
                  {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Subir
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <GoogleDrivePicker
          isOpen={showGoogleDrivePicker}
          onClose={() => setShowGoogleDrivePicker(false)}
          onSelect={async (file) => {
            try {
              const user = await base44.auth.me();
              await base44.entities.ProjectDocument.create({
                project_id: projectId,
                name: file.name,
                document_type: 'otro',
                file_url: file.url,
                uploaded_by: user.email,
                notes: 'Vinculado desde Google Drive'
              });
              queryClient.invalidateQueries({ queryKey: ['project-documents', projectId] });
              toast.success('Archivo vinculado correctamente');
              setShowGoogleDrivePicker(false);
            } catch (error) {
              toast.error('Error al vincular archivo');
            }
          }}
        />
      </CardContent>
    </Card>
  );
}