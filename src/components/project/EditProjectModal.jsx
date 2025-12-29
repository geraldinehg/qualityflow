import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Trash2, UserPlus, X, DollarSign } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { SITE_TYPE_CONFIG, PHASES, ROLE_CONFIG } from '../checklist/checklistTemplates';
import { useTechnologies } from '../checklist/useTechnologies';

export default function EditProjectModal({ isOpen, onClose, onSave, onDelete, project, isLoading }) {
  const technologies = useTechnologies();
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    site_type: '',
    technology: '',
    impact_level: 'medium',
    status: 'in_progress',
    target_date: null,
    phase_responsibles: {},
    applicable_areas: [],
    area_responsibles: {},
    project_value: ''
  });
  
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => base44.entities.TeamMember.filter({ is_active: true }),
    enabled: isOpen
  });
  
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        const member = teamMembers.find(m => m.user_email === user.email);
        setCurrentUserRole(member?.role);
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    if (isOpen) {
      loadUser();
    }
  }, [isOpen, teamMembers]);
  
  const { data: projectTypes = [] } = useQuery({
    queryKey: ['project-types'],
    queryFn: () => base44.entities.ProjectType.filter({ is_active: true }),
    enabled: isOpen
  });
  
  const { data: feeTypes = [] } = useQuery({
    queryKey: ['fee-types'],
    queryFn: () => base44.entities.FeeType.filter({ is_active: true }),
    enabled: isOpen
  });
  
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.filter({ is_active: true }),
    enabled: isOpen
  });
  
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        project_type: project.project_type || '',
        fee_type: project.fee_type || '',
        product_owner_email: project.product_owner_email || '',
        client_id: project.client_id || '',
        site_type: project.site_type || '',
        technology: project.technology || '',
        impact_level: project.impact_level || 'medium',
        status: project.status || 'in_progress',
        target_date: project.target_date ? new Date(project.target_date) : null,
        phase_responsibles: project.phase_responsibles || {},
        applicable_areas: project.applicable_areas || [],
        area_responsibles: project.area_responsibles || {},
        project_value: project.project_value || ''
      });
    }
  }, [project]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      target_date: formData.target_date ? format(formData.target_date, 'yyyy-MM-dd') : null
    });
  };
  
  const handleAddResponsible = (phase, email) => {
    setFormData(prev => ({
      ...prev,
      phase_responsibles: {
        ...prev.phase_responsibles,
        [phase]: [...(prev.phase_responsibles[phase] || []), email]
      }
    }));
  };
  
  const handleRemoveResponsible = (phase, email) => {
    setFormData(prev => ({
      ...prev,
      phase_responsibles: {
        ...prev.phase_responsibles,
        [phase]: (prev.phase_responsibles[phase] || []).filter(e => e !== email)
      }
    }));
  };
  
  const isValid = formData.name && formData.site_type && formData.technology;
  const visiblePhases = Object.entries(PHASES).filter(([key]) => !(project?.hidden_phases || []).includes(key));
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border-[#2a2a2a] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">Editar Proyecto</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Información básica */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del proyecto *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Landing Campaña Verano"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Breve descripción del proyecto..."
                className="h-20"
              />
            </div>
            
            {/* Clasificación */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Proyecto</Label>
                <Select
                  value={formData.project_type}
                  onValueChange={(value) => setFormData({ ...formData, project_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projectTypes.map((type) => (
                      <SelectItem key={type.id} value={type.key}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Tipo de Fee</Label>
                <Select
                  value={formData.fee_type}
                  onValueChange={(value) => setFormData({ ...formData, fee_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {feeTypes.map((type) => (
                      <SelectItem key={type.id} value={type.key}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Product Owner</Label>
                <Select
                  value={formData.product_owner_email}
                  onValueChange={(value) => setFormData({ ...formData, product_owner_email: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.filter(m => m.role === 'product_owner').map((member) => (
                      <SelectItem key={member.id} value={member.user_email}>
                        {member.display_name || member.user_email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Cliente / Sociedad</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de sitio *</Label>
                <Select
                  value={formData.site_type}
                  onValueChange={(value) => setFormData({ ...formData, site_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SITE_TYPE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Tecnología *</Label>
                <Select
                  value={formData.technology}
                  onValueChange={(value) => setFormData({ ...formData, technology: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(technologies).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="in_progress">En Progreso</SelectItem>
                    <SelectItem value="review">En Revisión</SelectItem>
                    <SelectItem value="blocked">Bloqueado</SelectItem>
                    <SelectItem value="completed">Completado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Nivel de impacto</Label>
                <Select
                  value={formData.impact_level}
                  onValueChange={(value) => setFormData({ ...formData, impact_level: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Bajo</SelectItem>
                    <SelectItem value="medium">Medio</SelectItem>
                    <SelectItem value="high">Alto</SelectItem>
                    <SelectItem value="critical">Crítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Fecha objetivo</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start font-normal bg-white text-black hover:bg-gray-100">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.target_date 
                        ? format(formData.target_date, "d MMM yyyy", { locale: es })
                        : "Seleccionar"
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.target_date}
                      onSelect={(date) => {
                        setFormData({ ...formData, target_date: date });
                        document.body.click();
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <Label className="text-gray-300">Áreas que aplican para este proyecto</Label>
            <p className="text-xs text-gray-400">Selecciona las áreas que participarán en el proyecto. Solo se mostrarán los checklist de estas áreas.</p>
            <div className="grid grid-cols-2 gap-3 p-4 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg">
              {[
                { id: 'creativity', label: 'Creatividad' },
                { id: 'software', label: 'Software/Desarrollo' },
                { id: 'seo', label: 'SEO' },
                { id: 'marketing', label: 'Marketing' },
                { id: 'paid', label: 'Paid Media' },
                { id: 'social', label: 'Social Media' }
              ].map(area => (
                <div key={area.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-${area.id}`}
                    checked={formData.applicable_areas.includes(area.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData({ 
                          ...formData, 
                          applicable_areas: [...formData.applicable_areas, area.id] 
                        });
                      } else {
                        setFormData({ 
                          ...formData, 
                          applicable_areas: formData.applicable_areas.filter(a => a !== area.id) 
                        });
                      }
                    }}
                    className="border-gray-600 data-[state=checked]:bg-[#FF1B7E] data-[state=checked]:border-[#FF1B7E]"
                  />
                  <label
                    htmlFor={`edit-${area.id}`}
                    className="text-sm text-gray-300 cursor-pointer"
                  >
                    {area.label}
                  </label>
                </div>
              ))}
            </div>
            
            {formData.applicable_areas.length > 0 && (
              <div className="space-y-3 mt-4">
                <Label className="text-gray-300">Responsables por área</Label>
                <p className="text-xs text-gray-400">Asigna un responsable para cada área seleccionada</p>
                <div className="space-y-3 p-4 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg">
                  {[
                    { id: 'creativity', label: 'Creatividad', rolePrefix: 'creativity' },
                    { id: 'software', label: 'Software/Desarrollo', rolePrefix: 'software' },
                    { id: 'seo', label: 'SEO', rolePrefix: 'seo' },
                    { id: 'marketing', label: 'Marketing', rolePrefix: 'marketing' },
                    { id: 'paid', label: 'Paid Media', rolePrefix: 'paid' },
                    { id: 'social', label: 'Social Media', rolePrefix: 'social' }
                  ].filter(area => formData.applicable_areas.includes(area.id)).map(area => (
                    <div key={area.id} className="flex items-center gap-3">
                      <Label className="min-w-[140px] text-sm text-gray-400">{area.label}</Label>
                      <Select
                        value={formData.area_responsibles[area.id] || ''}
                        onValueChange={(value) => setFormData({ 
                          ...formData, 
                          area_responsibles: { ...formData.area_responsibles, [area.id]: value }
                        })}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Seleccionar responsable..." />
                        </SelectTrigger>
                        <SelectContent>
                          {teamMembers
                            .filter(m => 
                              m.role === `leader_${area.rolePrefix}` || 
                              m.role === area.rolePrefix
                            )
                            .map((member) => (
                              <SelectItem key={member.id} value={member.user_email}>
                                {member.display_name || member.user_email}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {(currentUserRole === 'product_owner' || currentUserRole?.startsWith('leader_') || currentUserRole === 'ceo_antpack' || currentUserRole === 'web_leader') && (
              <div className="space-y-2 mt-4">
                <Label className="text-gray-300">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Valor del Proyecto
                </Label>
                <p className="text-xs text-gray-400">Este campo solo es visible para Product Owners y Líderes</p>
                <Input
                  type="number"
                  value={formData.project_value}
                  onChange={(e) => setFormData({ ...formData, project_value: e.target.value })}
                  placeholder="Ej: 5000"
                  className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#FF1B7E]"
                />
              </div>
            )}
          </div>
          
          <Separator />
          
          {/* Responsables por fase */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">Responsables por Fase</h3>
              <p className="text-xs text-gray-400">Asigna responsables para cada fase del proyecto</p>
            </div>
            
            <div className="space-y-3">
              {visiblePhases.map(([phaseKey, phaseConfig]) => {
                const displayName = project?.custom_phase_names?.[phaseKey] || phaseConfig.name;
                const responsibles = formData.phase_responsibles[phaseKey] || [];
                
                return (
                  <div key={phaseKey} className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-300">{displayName}</Label>
                      <Select
                        onValueChange={(email) => handleAddResponsible(phaseKey, email)}
                      >
                        <SelectTrigger className="w-48 h-8 text-xs">
                          <SelectValue placeholder="+ Agregar responsable" />
                        </SelectTrigger>
                        <SelectContent>
                          {teamMembers
                            .filter(m => !responsibles.includes(m.user_email))
                            .map((member) => (
                              <SelectItem key={member.id} value={member.user_email}>
                                {member.display_name || member.user_email}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {responsibles.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {responsibles.map((email) => {
                          const member = teamMembers.find(m => m.user_email === email);
                          return (
                            <Badge key={email} className="bg-[#FF1B7E]/20 border-[#FF1B7E]/40 text-[#FF1B7E] pl-2 pr-1 py-1 hover:bg-[#FF1B7E]/30">
                              <span className="text-xs">{member?.display_name || email}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveResponsible(phaseKey, email)}
                                className="ml-1 hover:text-white"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          <DialogFooter className="flex justify-between items-center">
            <Button 
              type="button" 
              variant="destructive" 
              onClick={() => onDelete(project.id)}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar Proyecto
            </Button>
            <div className="flex gap-2">
              <Button type="button" onClick={onClose} className="bg-white hover:bg-gray-100 text-black border-white">
                Cancelar
              </Button>
              <Button type="submit" disabled={!isValid || isLoading} className="bg-gray-200 hover:bg-gray-300 text-black">
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Guardar Cambios
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}