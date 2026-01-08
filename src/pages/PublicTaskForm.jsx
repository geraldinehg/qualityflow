import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CheckCircle2, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function PublicTaskForm() {
  const urlParams = new URLSearchParams(window.location.search);
  const formToken = urlParams.get('token') || window.location.pathname.split('/').pop();
  
  const [formData, setFormData] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const { data: formConfig, isLoading } = useQuery({
    queryKey: ['public-form', formToken],
    queryFn: async () => {
      const forms = await base44.entities.TaskFormPublicUrl.filter({ 
        form_token: formToken,
        is_active: true 
      });
      
      if (!forms || forms.length === 0) {
        throw new Error('Formulario no encontrado o inactivo');
      }

      const form = forms[0];
      
      // Cargar configuración de tareas
      const configs = await base44.entities.TaskConfiguration.filter({ 
        project_id: form.project_id 
      });
      
      return {
        ...form,
        taskConfig: configs[0]
      };
    },
    enabled: !!formToken,
    retry: false
  });

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      return base44.functions.invoke('submitPublicTaskForm', {
        form_token: formToken,
        task_data: data
      });
    },
    onSuccess: () => {
      setIsSubmitted(true);
      setIsSubmitting(false);
    },
    onError: (err) => {
      setError(err.message || 'Error al enviar el formulario');
      setIsSubmitting(false);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validar título obligatorio
    if (!formData.title) {
      setError('El título es obligatorio');
      return;
    }
    
    // Validar campos personalizados obligatorios
    const customFields = formConfig?.taskConfig?.custom_fields || [];
    for (const field of customFields) {
      if (field.required && field.visible && !formData.custom_fields?.[field.key]) {
        setError(`El campo "${field.label}" es obligatorio`);
        return;
      }
    }

    setError(null);
    setIsSubmitting(true);
    submitMutation.mutate(formData);
  };

  const renderField = (field) => {
    const taskConfig = formConfig?.taskConfig;
    const fieldKey = field.key;
    
    switch (fieldKey) {
      case 'title':
        return (
          <div>
            <label className="text-sm font-medium text-[var(--text-primary)] mb-2 block">
              Título *
            </label>
            <Input
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Escribe el título"
              required
            />
          </div>
        );
      
      case 'description':
        return (
          <div>
            <label className="text-sm font-medium text-[var(--text-primary)] mb-2 block">
              Descripción
            </label>
            <Textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe los detalles"
              className="h-32"
            />
          </div>
        );
      
      case 'priority':
        return (
          <div>
            <label className="text-sm font-medium text-[var(--text-primary)] mb-2 block">
              Prioridad
            </label>
            <Select
              value={formData.priority || taskConfig?.custom_priorities?.[0]?.key}
              onValueChange={(value) => setFormData({ ...formData, priority: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {(taskConfig?.custom_priorities || []).map((p) => (
                  <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      
      case 'due_date':
        return (
          <div>
            <label className="text-sm font-medium text-[var(--text-primary)] mb-2 block">
              Fecha de vencimiento
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.due_date ? format(new Date(formData.due_date), "d 'de' MMMM, yyyy", { locale: es }) : 'Seleccionar fecha'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white">
                <Calendar
                  mode="single"
                  selected={formData.due_date ? new Date(formData.due_date) : undefined}
                  onSelect={(date) => {
                    setFormData({ ...formData, due_date: date ? format(date, 'yyyy-MM-dd') : null });
                    document.body.click();
                  }}
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>
        );
      
      default:
        // Campo personalizado
        switch (field.type) {
          case 'text':
            return (
              <div>
                <label className="text-sm font-medium text-[var(--text-primary)] mb-2 block">
                  {field.label} {field.required && '*'}
                </label>
                <Input
                  value={formData.custom_fields?.[fieldKey] || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    custom_fields: { ...(formData.custom_fields || {}), [fieldKey]: e.target.value }
                  })}
                  required={field.required}
                />
              </div>
            );
          
          case 'textarea':
            return (
              <div>
                <label className="text-sm font-medium text-[var(--text-primary)] mb-2 block">
                  {field.label} {field.required && '*'}
                </label>
                <Textarea
                  value={formData.custom_fields?.[fieldKey] || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    custom_fields: { ...(formData.custom_fields || {}), [fieldKey]: e.target.value }
                  })}
                  required={field.required}
                  className="h-24"
                />
              </div>
            );
          
          case 'select':
            return (
              <div>
                <label className="text-sm font-medium text-[var(--text-primary)] mb-2 block">
                  {field.label} {field.required && '*'}
                </label>
                <Select
                  value={formData.custom_fields?.[fieldKey] || ''}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    custom_fields: { ...(formData.custom_fields || {}), [fieldKey]: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Seleccionar ${field.label}`} />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {(field.options || []).map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          
          default:
            return null;
        }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF1B7E]" />
      </div>
    );
  }

  if (!formConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-[var(--text-secondary)]">Formulario no encontrado o inactivo</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              {formConfig.success_message || '¡Enviado correctamente!'}
            </h2>
            {formConfig.redirect_url ? (
              <Button
                onClick={() => window.location.href = formConfig.redirect_url}
                className="bg-[#FF1B7E] hover:bg-[#e6156e]"
              >
                Continuar
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({});
                }}
                variant="outline"
              >
                Enviar otra solicitud
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="text-2xl">{formConfig.form_title}</CardTitle>
          {formConfig.form_description && (
            <CardDescription className="text-base">{formConfig.form_description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campos base siempre visibles */}
            {renderField({ key: 'title', type: 'title' })}
            {renderField({ key: 'description', type: 'description' })}
            {renderField({ key: 'priority', type: 'priority' })}
            {renderField({ key: 'due_date', type: 'due_date' })}
            
            {/* Campos personalizados visibles */}
            {(formConfig.taskConfig?.custom_fields || [])
              .filter(f => f.visible)
              .map((field) => (
                <div key={field.key}>
                  {renderField(field)}
                </div>
              ))}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#FF1B7E] hover:bg-[#e6156e]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}