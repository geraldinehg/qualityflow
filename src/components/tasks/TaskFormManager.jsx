import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Copy, Link2, Plus, Settings, Eye, EyeOff, ExternalLink, X } from 'lucide-react';
import { toast } from 'sonner';

export default function TaskFormManager({ projectId, config }) {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    form_title: '',
    default_status: config?.custom_statuses?.[0]?.key || 'todo',
    notification_emails: []
  });
  const [emailInput, setEmailInput] = useState('');

  const queryClient = useQueryClient();

  const { data: formUrls = [] } = useQuery({
    queryKey: ['task-form-urls', projectId],
    queryFn: () => base44.entities.TaskFormPublicUrl.filter({ project_id: projectId }),
    enabled: !!projectId
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const token = `${projectId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      return base44.entities.TaskFormPublicUrl.create({
        ...data,
        project_id: projectId,
        form_token: token,
        is_active: true
      });
    },
    onSuccess: (newForm) => {
      queryClient.invalidateQueries({ queryKey: ['task-form-urls', projectId] });
      setIsCreating(false);
      setFormData({
        form_title: '',
        default_status: config?.custom_statuses?.[0]?.key || 'todo',
        notification_emails: []
      });
      setEmailInput('');
      
      toast.success('✅ Formulario creado correctamente', { duration: 3000 });
      
      // Copiar URL automáticamente
      const url = `${window.location.origin}/public/task-form/${newForm.form_token}`;
      navigator.clipboard.writeText(url);
      toast.info('📋 URL copiada al portapapeles', { duration: 2000 });
    },
    onError: (error) => {
      toast.error(`❌ Error al crear formulario: ${error.message}`);
    }
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => 
      base44.entities.TaskFormPublicUrl.update(id, { is_active }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-form-urls', projectId] });
      const status = variables.is_active ? 'activado' : 'desactivado';
      toast.success(`✅ Formulario ${status}`, { duration: 2000 });
    },
    onError: (error) => {
      toast.error(`❌ Error al actualizar: ${error.message}`);
    }
  });

  const handleCreate = () => {
    if (!formData.form_title) {
      toast.error('El título es obligatorio');
      return;
    }
    
    const payload = {
      ...formData,
      form_description: '',
      visible_fields: [],
      require_authentication: false,
      max_submissions_per_day: null,
      success_message: formData.success_message || '¡Gracias! Tu solicitud ha sido recibida.'
    };
    
    createMutation.mutate(payload);
  };

  const copyFormUrl = (token) => {
    const url = `${window.location.origin}/PublicTaskForm?token=${token}`;
    navigator.clipboard.writeText(url);
    toast.success('URL copiada al portapapeles');
  };

  const addEmail = () => {
    if (!emailInput.trim()) return;
    
    // Validar formato email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput)) {
      toast.error('Email inválido');
      return;
    }
    
    if (formData.notification_emails.includes(emailInput)) {
      toast.error('Este email ya está agregado');
      return;
    }
    
    setFormData({
      ...formData,
      notification_emails: [...formData.notification_emails, emailInput]
    });
    setEmailInput('');
  };

  const removeEmail = (email) => {
    setFormData({
      ...formData,
      notification_emails: formData.notification_emails.filter(e => e !== email)
    });
  };



  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Formularios Públicos</h3>
          <p className="text-sm text-[var(--text-secondary)]">Crea formularios para recibir tareas externamente</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="bg-[#FF1B7E] hover:bg-[#e6156e]">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Formulario
        </Button>
      </div>

      {/* Crear nuevo formulario */}
      {isCreating && (
        <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
          <CardHeader>
            <CardTitle className="text-sm">Configurar Formulario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-2 block">
                Título del formulario *
              </label>
              <Input
                value={formData.form_title}
                onChange={(e) => setFormData({ ...formData, form_title: e.target.value })}
                placeholder="Ej: Solicitudes de Soporte"
              />
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                Los campos visibles se configuran desde la pestaña "Campos Personalizados"
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-2 block">
                Emails para notificaciones
              </label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEmail())}
                  placeholder="email@ejemplo.com"
                />
                <Button type="button" onClick={addEmail} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.notification_emails.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.notification_emails.map((email) => (
                    <Badge key={email} variant="secondary" className="gap-1">
                      {email}
                      <button onClick={() => removeEmail(email)} className="ml-1">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                Se enviará un correo a estas direcciones cuando se reciba un nuevo formulario
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-2 block">
                Mensaje de éxito personalizado
              </label>
              <Textarea
                value={formData.success_message || ''}
                onChange={(e) => setFormData({ ...formData, success_message: e.target.value })}
                placeholder="¡Gracias! Tu solicitud ha sido recibida."
                className="h-20"
              />
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                Este mensaje se mostrará al usuario después de enviar el formulario
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} className="bg-[#FF1B7E] hover:bg-[#e6156e]">
                Crear Formulario
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de formularios existentes */}
      <div className="grid gap-3">
        {formUrls.map((form) => (
          <Card key={form.id} className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-[var(--text-primary)]">{form.form_title}</h4>
                    <Badge variant={form.is_active ? 'default' : 'secondary'} className="text-xs">
                      {form.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  {form.notification_emails && form.notification_emails.length > 0 && (
                    <p className="text-xs text-[var(--text-secondary)]">
                      Notifica a: {form.notification_emails.join(', ')}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                    <Link2 className="h-3 w-3" />
                    <code className="bg-[var(--bg-tertiary)] px-2 py-1 rounded">
                      /PublicTaskForm?token={form.form_token}
                    </code>
                  </div>
                </div>

                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyFormUrl(form.form_token)}
                    title="Copiar URL"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(`/PublicTaskForm?token=${form.form_token}`, '_blank')}
                    title="Abrir formulario"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleMutation.mutate({ id: form.id, is_active: !form.is_active })}
                    title={form.is_active ? 'Desactivar' : 'Activar'}
                  >
                    {form.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {formUrls.length === 0 && !isCreating && (
          <div className="text-center py-8 text-sm text-[var(--text-secondary)]">
            No hay formularios públicos. Crea uno para comenzar.
          </div>
        )}
      </div>
    </div>
  );
}