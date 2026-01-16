import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Save, X, CheckCircle2, Trash2, Settings, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function PreviewTab({ projectId, project }) {
  const [markupMode, setMarkupMode] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(project?.preview_url || '');
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [tempUrl, setTempUrl] = useState('');
  const [selectedComment, setSelectedComment] = useState(null);
  const [newComment, setNewComment] = useState(null);
  const [iframeUrl, setIframeUrl] = useState(project?.preview_url || '');
  
  const iframeRef = useRef(null);
  const containerRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
    staleTime: Infinity
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['preview-comments', projectId],
    queryFn: () => base44.entities.PreviewComment.filter({ project_id: projectId }),
    enabled: !!projectId,
    refetchOnWindowFocus: false
  });

  const updateProjectMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.update(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setIsEditingUrl(false);
      setPreviewUrl(tempUrl);
      setIframeUrl(tempUrl);
      toast.success('URL de previsualización guardada');
    }
  });

  const createCommentMutation = useMutation({
    mutationFn: (data) => base44.entities.PreviewComment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preview-comments', projectId] });
      setNewComment(null);
      setMarkupMode(false);
      toast.success('Comentario agregado');
    }
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PreviewComment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preview-comments', projectId] });
      setSelectedComment(null);
      toast.success('Comentario actualizado');
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (id) => base44.entities.PreviewComment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preview-comments', projectId] });
      setSelectedComment(null);
      toast.success('Comentario eliminado');
    }
  });

  const handleSaveUrl = () => {
    if (!tempUrl.trim()) {
      toast.error('Ingresa una URL válida');
      return;
    }
    updateProjectMutation.mutate({ preview_url: tempUrl });
  };

  const handleIframeClick = async (e) => {
    if (!markupMode) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    try {
      const canvas = await html2canvas(containerRef.current, {
        allowTaint: true,
        useCORS: true,
        logging: false,
        scale: 0.5
      });
      
      const screenshot = canvas.toDataURL('image/jpeg', 0.7);
      
      const { file_url } = await base44.integrations.Core.UploadFile({
        file: screenshot
      });

      setNewComment({
        position_x: x,
        position_y: y,
        screenshot_url: file_url,
        iframe_url: iframeUrl,
        comment_text: ''
      });
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      toast.error('Error al capturar pantalla');
    }
  };

  const handleSaveComment = () => {
    if (!newComment?.comment_text?.trim()) {
      toast.error('Escribe un comentario');
      return;
    }

    createCommentMutation.mutate({
      project_id: projectId,
      comment_text: newComment.comment_text,
      screenshot_url: newComment.screenshot_url,
      position_x: newComment.position_x,
      position_y: newComment.position_y,
      iframe_url: newComment.iframe_url,
      author_email: user?.email,
      author_name: user?.full_name
    });
  };

  const openComments = comments.filter(c => c.status === 'open');
  const resolvedComments = comments.filter(c => c.status === 'resolved');

  if (!previewUrl && !isEditingUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <AlertCircle className="h-12 w-12 text-[var(--text-secondary)] mb-4" />
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
          No hay URL de previsualización
        </h3>
        <p className="text-sm text-[var(--text-secondary)] text-center mb-6 max-w-md">
          Configura la URL del sitio a previsualizar para comenzar a agregar comentarios
        </p>
        <Button onClick={() => setIsEditingUrl(true)}>
          <Settings className="h-4 w-4 mr-2" />
          Configurar URL
        </Button>
      </div>
    );
  }

  if (isEditingUrl) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Configurar URL de Previsualización</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="https://ejemplo.com"
            value={tempUrl}
            onChange={(e) => setTempUrl(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={handleSaveUrl} disabled={updateProjectMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Guardar
            </Button>
            <Button variant="outline" onClick={() => setIsEditingUrl(false)}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Vista de previsualización */}
      <div className="lg:col-span-3 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Button
              variant={markupMode ? "default" : "outline"}
              onClick={() => setMarkupMode(!markupMode)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              {markupMode ? 'Desactivar Comentarios' : 'Activar Comentarios'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsEditingUrl(true)}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">
              {openComments.length} abiertos
            </Badge>
            <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-0">
              {resolvedComments.length} resueltos
            </Badge>
          </div>
        </div>

        {markupMode && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-300">
            Click en cualquier parte de la previsualización para agregar un comentario
          </div>
        )}

        <Card>
          <CardContent className="p-0">
            <div 
              ref={containerRef}
              className="relative w-full bg-white"
              style={{ height: '70vh' }}
              onClick={handleIframeClick}
            >
              <iframe
                ref={iframeRef}
                src={iframeUrl}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-forms"
                onLoad={(e) => {
                  try {
                    setIframeUrl(e.target.contentWindow.location.href);
                  } catch (err) {
                    // CORS prevents access to iframe URL
                  }
                }}
              />

              {/* Marcadores de comentarios */}
              {openComments.map(comment => (
                <button
                  key={comment.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedComment(comment);
                  }}
                  className="absolute w-8 h-8 bg-[#FF1B7E] rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform cursor-pointer border-2 border-white"
                  style={{
                    left: `${comment.position_x}%`,
                    top: `${comment.position_y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <MessageSquare className="h-4 w-4" />
                </button>
              ))}

              {/* Preview de nuevo comentario */}
              {newComment && (
                <div
                  className="absolute w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg animate-pulse border-2 border-white"
                  style={{
                    left: `${newComment.position_x}%`,
                    top: `${newComment.position_y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <MessageSquare className="h-4 w-4" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Panel de comentarios */}
      <div className="space-y-4">
        {/* Formulario de nuevo comentario */}
        {newComment && (
          <Card className="border-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Nuevo Comentario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {newComment.screenshot_url && (
                <img 
                  src={newComment.screenshot_url} 
                  alt="Captura" 
                  className="w-full rounded-lg border border-[var(--border-primary)]"
                />
              )}
              <Textarea
                placeholder="Escribe tu comentario..."
                value={newComment.comment_text}
                onChange={(e) => setNewComment({ ...newComment, comment_text: e.target.value })}
                rows={3}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveComment} disabled={createCommentMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </Button>
                <Button size="sm" variant="outline" onClick={() => setNewComment(null)}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comentario seleccionado */}
        {selectedComment && (
          <Card className="border-[#FF1B7E]">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{selectedComment.author_name}</CardTitle>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    {format(new Date(selectedComment.created_date), "d MMM, HH:mm", { locale: es })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setSelectedComment(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedComment.screenshot_url && (
                <img 
                  src={selectedComment.screenshot_url} 
                  alt="Captura" 
                  className="w-full rounded-lg border border-[var(--border-primary)]"
                />
              )}
              <p className="text-sm text-[var(--text-primary)]">{selectedComment.comment_text}</p>
              <div className="flex gap-2 pt-2">
                {selectedComment.status === 'open' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateCommentMutation.mutate({
                      id: selectedComment.id,
                      data: { status: 'resolved' }
                    })}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Resolver
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => {
                    if (confirm('¿Eliminar este comentario?')) {
                      deleteCommentMutation.mutate(selectedComment.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de comentarios abiertos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Comentarios Abiertos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {openComments.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)] text-center py-4">
                No hay comentarios abiertos
              </p>
            ) : (
              openComments.map(comment => (
                <button
                  key={comment.id}
                  onClick={() => setSelectedComment(comment)}
                  className="w-full text-left p-3 rounded-lg border border-[var(--border-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <p className="text-sm font-medium text-[var(--text-primary)] line-clamp-2">
                    {comment.comment_text}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    {comment.author_name} • {format(new Date(comment.created_date), "d MMM", { locale: es })}
                  </p>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}