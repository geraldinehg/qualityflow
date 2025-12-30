import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, CheckSquare, Plus, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from "@/components/ui/checkbox";
import GoogleDrivePicker from '../googledrive/GoogleDrivePicker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { SITE_TYPE_CONFIG } from '../checklist/checklistTemplates';
import { useTechnologies } from '../checklist/useTechnologies';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function CreateProjectModal({ isOpen, onClose, onCreate, isLoading, initialData, isEditing }) {
  const technologies = useTechnologies();
  const queryClient = useQueryClient();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedBrief, setSelectedBrief] = useState(null);
  const [showGoogleDrivePicker, setShowGoogleDrivePicker] = useState(false);
  const [showAddProjectType, setShowAddProjectType] = useState(false);
  const [showAddFeeType, setShowAddFeeType] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddProductOwner, setShowAddProductOwner] = useState(false);
  const [showAddTechnology, setShowAddTechnology] = useState(false);
  const [showAddSiteType, setShowAddSiteType] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newPOEmail, setNewPOEmail] = useState('');
  const [newPOName, setNewPOName] = useState('');
  
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
  
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => base44.entities.TeamMember.filter({ is_active: true }),
    enabled: isOpen
  });
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_type: '',
    fee_type: '',
    product_owner_email: '',
    client_id: '',
    site_type: '',
    technology: '',
    impact_level: 'medium',
    target_date: null,
    applicable_areas: [],
    area_responsibles: {},
    project_value: ''
  });
  
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  
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
  
  const createProjectTypeMutation = useMutation({
    mutationFn: (name) => base44.entities.ProjectType.create({
      name,
      key: name.toLowerCase().replace(/\s+/g, '_'),
      is_active: true
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-types'] });
      setFormData({ ...formData, project_type: data.key });
      setShowAddProjectType(false);
      setNewItemName('');
      toast.success('Tipo de proyecto creado');
    }
  });
  
  const createFeeTypeMutation = useMutation({
    mutationFn: (name) => base44.entities.FeeType.create({
      name,
      key: name.toLowerCase().replace(/\s+/g, '_'),
      is_active: true
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fee-types'] });
      setFormData({ ...formData, fee_type: data.key });
      setShowAddFeeType(false);
      setNewItemName('');
      toast.success('Tipo de fee creado');
    }
  });
  
  const createClientMutation = useMutation({
    mutationFn: (name) => base44.entities.Client.create({
      name,
      is_active: true
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setFormData({ ...formData, client_id: data.id });
      setShowAddClient(false);
      setNewItemName('');
      toast.success('Cliente creado');
    }
  });
  
  const createProductOwnerMutation = useMutation({
    mutationFn: ({ email, name }) => base44.entities.TeamMember.create({
      user_email: email,
      display_name: name,
      role: 'product_owner',
      is_active: true
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      setFormData({ ...formData, product_owner_email: data.user_email });
      setShowAddProductOwner(false);
      setNewPOEmail('');
      setNewPOName('');
      toast.success('Product Owner creado');
    }
  });
  
  const createTechnologyMutation = useMutation({
    mutationFn: (name) => base44.entities.Technology.create({
      name,
      key: name.toLowerCase().replace(/\s+/g, '_'),
      color: 'bg-cyan-500',
      is_active: true
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['technologies'] });
      setFormData({ ...formData, technology: data.key });
      setShowAddTechnology(false);
      setNewItemName('');
      toast.success('Tecnología creada');
    }
  });
  
  const { data: siteTypes = [] } = useQuery({
    queryKey: ['site-types'],
    queryFn: () => base44.entities.SiteType.filter({ is_active: true }),
    enabled: isOpen
  });
  
  const createSiteTypeMutation = useMutation({
    mutationFn: (name) => base44.entities.SiteType.create({
      name,
      key: name.toLowerCase().replace(/\s+/g, '_'),
      is_active: true
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['site-types'] });
      setFormData({ ...formData, site_type: data.key });
      setShowAddSiteType(false);
      setNewItemName('');
      toast.success('Tipo de sitio creado');
    }
  });
  
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        site_type: initialData.site_type || '',
        technology: initialData.technology || '',
        impact_level: initialData.impact_level || 'medium',
        target_date: initialData.target_date ? new Date(initialData.target_date) : null,
        applicable_areas: initialData.applicable_areas || []
      });
    } else {
      setFormData({
        name: '',
        description: '',
        project_type: '',
        fee_type: '',
        product_owner_email: '',
        client_id: '',
        site_type: '',
        technology: '',
        impact_level: 'medium',
        target_date: null,
        applicable_areas: [],
        area_responsibles: {},
        project_value: ''
      });
      setCurrentStep(1);
    }
  }, [initialData, isOpen]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      target_date: formData.target_date ? format(formData.target_date, 'yyyy-MM-dd') : null,
      status: 'in_progress',
      completion_percentage: 0,
      critical_pending: 0,
      has_conflicts: false
    };
    
    // Solo incluir project_value si tiene un valor válido
    if (!formData.project_value || formData.project_value === '') {
      delete data.project_value;
    } else {
      data.project_value = parseFloat(formData.project_value);
    }
    
    // Crear el proyecto
    await onCreate(data);
    
    // Si hay un brief seleccionado, guardarlo después de crear el proyecto
    if (selectedBrief && data.id) {
      try {
        const user = await base44.auth.me();
        await base44.entities.ProjectDocument.create({
          project_id: data.id,
          name: selectedBrief.name,
          document_type: 'brief',
          file_url: selectedBrief.url,
          uploaded_by: user.email,
          notes: 'Brief del proyecto vinculado desde Google Drive'
        });
      } catch (error) {
        console.error('Error guardando brief:', error);
      }
    }
  };
  
  const isStep1Valid = formData.name && formData.project_type && formData.product_owner_email;
  const isStep2Valid = formData.applicable_areas.length > 0;
  const isStep3Valid = true; // El brief es opcional
  const isValid = isStep1Valid && isStep2Valid && isStep3Valid;
  
  const handleNext = () => {
    if (currentStep === 1 && isStep1Valid) {
      setCurrentStep(2);
    } else if (currentStep === 2 && isStep2Valid) {
      setCurrentStep(3);
    }
  };
  
  const handleBack = () => {
    if (currentStep === 3) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(1);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-primary)]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-[var(--text-primary)]">
              {isEditing ? 'Editar Proyecto' : 'Nuevo Proyecto'}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                currentStep === 1 ? "bg-[#FF1B7E] text-white" : "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"
              )}>
                1
              </div>
              <div className="w-8 h-0.5 bg-[var(--border-primary)]" />
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                currentStep === 2 ? "bg-[#FF1B7E] text-white" : "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"
              )}>
                2
              </div>
              <div className="w-8 h-0.5 bg-[var(--border-primary)]" />
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                currentStep === 3 ? "bg-[#FF1B7E] text-white" : "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"
              )}>
                3
              </div>
            </div>
          </div>
          {currentStep === 1 && (
            <p className="text-sm text-[var(--text-secondary)] mt-2">
              Paso 1: Completa los datos básicos del proyecto
            </p>
          )}
          {currentStep === 2 && (
            <p className="text-sm text-[var(--text-secondary)] mt-2">
              Paso 2: Asigna las áreas y selecciona los responsables
            </p>
          )}
          {currentStep === 3 && (
            <p className="text-sm text-[var(--text-secondary)] mt-2">
              Paso 3: Adjunta el brief del proyecto (opcional)
            </p>
          )}
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* PASO 1: Datos Básicos */}
          {currentStep === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[var(--text-primary)]">Nombre del proyecto *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Landing Campaña Verano"
              className="bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[#FF1B7E]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-[var(--text-primary)]">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Breve descripción del proyecto..."
              className="h-20 bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[#FF1B7E]"
            />
          </div>
          
          {/* Clasificación */}
          <div className="space-y-2">
            <Label className="text-[var(--text-primary)]">Tipo de Proyecto *</Label>
            {showAddProjectType ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Nombre del tipo..."
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-primary)]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newItemName.trim()) {
                      createProjectTypeMutation.mutate(newItemName);
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => newItemName.trim() && createProjectTypeMutation.mutate(newItemName)}
                  disabled={createProjectTypeMutation.isPending}
                  className="bg-[#FF1B7E] hover:bg-[#e6156e]"
                >
                  {createProjectTypeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowAddProjectType(false);
                    setNewItemName('');
                  }}
                >
                  ✕
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
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
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => setShowAddProjectType(true)}
                  className="flex-shrink-0 bg-white border-gray-300 text-black hover:bg-[#FF1B7E] hover:text-white hover:border-[#FF1B7E]"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[var(--text-primary)]">Product Owner *</Label>
              {showAddProductOwner ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Email..."
                      type="email"
                      value={newPOEmail}
                      onChange={(e) => setNewPOEmail(e.target.value)}
                      className="bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-primary)]"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowAddProductOwner(false);
                        setNewPOEmail('');
                        setNewPOName('');
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nombre..."
                      value={newPOName}
                      onChange={(e) => setNewPOName(e.target.value)}
                      className="bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-primary)]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newPOEmail.trim() && newPOName.trim()) {
                          createProductOwnerMutation.mutate({ email: newPOEmail, name: newPOName });
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => newPOEmail.trim() && newPOName.trim() && createProductOwnerMutation.mutate({ email: newPOEmail, name: newPOName })}
                      disabled={createProductOwnerMutation.isPending}
                      className="bg-[#FF1B7E] hover:bg-[#e6156e]"
                    >
                      {createProductOwnerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
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
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => setShowAddProductOwner(true)}
                    className="flex-shrink-0 bg-white border-gray-300 text-black hover:bg-[#FF1B7E] hover:text-white hover:border-[#FF1B7E]"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label className="text-[var(--text-primary)]">Cliente / Sociedad</Label>
              {showAddClient ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Nombre del cliente..."
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-primary)]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newItemName.trim()) {
                        createClientMutation.mutate(newItemName);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => newItemName.trim() && createClientMutation.mutate(newItemName)}
                    disabled={createClientMutation.isPending}
                    className="bg-[#FF1B7E] hover:bg-[#e6156e]"
                  >
                    {createClientMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowAddClient(false);
                      setNewItemName('');
                    }}
                  >
                    ✕
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
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
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => setShowAddClient(true)}
                    className="flex-shrink-0 bg-white border-gray-300 text-black hover:bg-[#FF1B7E] hover:text-white hover:border-[#FF1B7E]"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          

          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[var(--text-primary)]">Nivel de impacto</Label>
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
              <Label className="text-[var(--text-primary)]">Fecha objetivo</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal bg-white text-black hover:bg-gray-100">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.target_date 
                      ? format(formData.target_date, "d MMM yyyy", { locale: es })
                      : "Seleccionar fecha"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.target_date}
                    onSelect={(date) => {
                      setFormData({ ...formData, target_date: date });
                      // Cerrar el popover
                      document.body.click();
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          </>
          )}
          
          {/* PASO 2: Áreas y Responsables */}
          {currentStep === 2 && (
            <>
              {formData.applicable_areas.includes('software') && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label className="text-[var(--text-primary)]">Tipo de sitio</Label>
                    {showAddSiteType ? (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nombre del tipo de sitio..."
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          className="bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-primary)]"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newItemName.trim()) {
                              createSiteTypeMutation.mutate(newItemName);
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => newItemName.trim() && createSiteTypeMutation.mutate(newItemName)}
                          disabled={createSiteTypeMutation.isPending}
                          className="bg-[#FF1B7E] hover:bg-[#e6156e]"
                        >
                          {createSiteTypeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear'}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setShowAddSiteType(false);
                            setNewItemName('');
                          }}
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Select
                          value={formData.site_type}
                          onValueChange={(value) => setFormData({ ...formData, site_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                          <SelectContent>
                            {siteTypes.map((type) => (
                              <SelectItem key={type.id} value={type.key}>{type.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => setShowAddSiteType(true)}
                          className="flex-shrink-0 bg-white border-gray-300 text-black hover:bg-[#FF1B7E] hover:text-white hover:border-[#FF1B7E]"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-[var(--text-primary)]">Tecnología</Label>
                    {showAddTechnology ? (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nombre de la tecnología..."
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          className="bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-primary)]"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newItemName.trim()) {
                              createTechnologyMutation.mutate(newItemName);
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => newItemName.trim() && createTechnologyMutation.mutate(newItemName)}
                          disabled={createTechnologyMutation.isPending}
                          className="bg-[#FF1B7E] hover:bg-[#e6156e]"
                        >
                          {createTechnologyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear'}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setShowAddTechnology(false);
                            setNewItemName('');
                          }}
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
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
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => setShowAddTechnology(true)}
                          className="flex-shrink-0 bg-white border-gray-300 text-black hover:bg-[#FF1B7E] hover:text-white hover:border-[#FF1B7E]"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                <Label className="text-[var(--text-primary)]">Áreas que aplican para este proyecto *</Label>
            <p className="text-xs text-[var(--text-secondary)]">Selecciona las áreas que participarán en el proyecto. Solo se mostrarán los checklist de estas áreas.</p>
            <div className="grid grid-cols-2 gap-3 p-4 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg">
              {[
                { id: 'ux', label: 'UX', rolePrefix: 'ux' },
                { id: 'ui', label: 'UI', rolePrefix: 'ui' },
                { id: 'seo', label: 'SEO', rolePrefix: 'seo' },
                { id: 'paid', label: 'Paid Media', rolePrefix: 'paid' },
                { id: 'software', label: 'Software/Desarrollo', rolePrefix: 'software' },
                { id: 'web_dev', label: 'Desarrollo web', rolePrefix: 'web_dev' },
                { id: 'marketing', label: 'Marketing', rolePrefix: 'marketing' },
                { id: 'social', label: 'Social Media', rolePrefix: 'social' }
              ].map(area => (
                <div key={area.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={area.id}
                    checked={formData.applicable_areas.includes(area.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData({ 
                          ...formData, 
                          applicable_areas: [...formData.applicable_areas, area.id] 
                        });
                      } else {
                        const newAreas = formData.applicable_areas.filter(a => a !== area.id);
                        const newResponsibles = { ...formData.area_responsibles };
                        delete newResponsibles[area.id];
                        setFormData({ 
                          ...formData, 
                          applicable_areas: newAreas,
                          area_responsibles: newResponsibles
                        });
                      }
                    }}
                    className="border-gray-600 data-[state=checked]:bg-[#FF1B7E] data-[state=checked]:border-[#FF1B7E]"
                  />
                  <label
                    htmlFor={area.id}
                    className="text-sm text-[var(--text-primary)] cursor-pointer"
                  >
                    {area.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {formData.applicable_areas.length > 0 && (
            <div className="space-y-3">
              <Label className="text-[var(--text-primary)]">Responsables por área</Label>
              <p className="text-xs text-[var(--text-secondary)]">Asigna un responsable para cada área seleccionada</p>
              <div className="space-y-3 p-4 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg">
                {[
                  { id: 'ux', label: 'UX', rolePrefix: 'ux' },
                  { id: 'ui', label: 'UI', rolePrefix: 'ui' },
                  { id: 'seo', label: 'SEO', rolePrefix: 'seo' },
                  { id: 'paid', label: 'Paid Media', rolePrefix: 'paid' },
                  { id: 'software', label: 'Software/Desarrollo', rolePrefix: 'software' },
                  { id: 'web_dev', label: 'Desarrollo web', rolePrefix: 'web_dev' },
                  { id: 'marketing', label: 'Marketing', rolePrefix: 'marketing' },
                  { id: 'social', label: 'Social Media', rolePrefix: 'social' }
                ].filter(area => formData.applicable_areas.includes(area.id)).map(area => (
                  <div key={area.id} className="flex items-center gap-3">
                    <Label className="min-w-[140px] text-sm text-[var(--text-secondary)]">{area.label}</Label>
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
              
              {(currentUserRole === 'product_owner' || currentUserRole?.startsWith('leader_') || currentUserRole === 'administrador' || currentUserRole === 'web_leader') && (
                <div className="space-y-2">
                  <Label className="text-white">Valor del Proyecto</Label>
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
            </>
          )}
          
          {/* PASO 3: Brief del Proyecto */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-[var(--text-primary)]">Brief del Proyecto</Label>
                <p className="text-xs text-[var(--text-secondary)]">
                  Selecciona el brief del proyecto desde tu Google Drive
                </p>
                
                {selectedBrief ? (
                  <div className="p-4 bg-[var(--bg-primary)] border border-[#FF1B7E]/40 rounded-lg">
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-[#FF1B7E] flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {selectedBrief.name}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                          Archivo seleccionado de Google Drive
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedBrief(null)}
                        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      >
                        Cambiar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    onClick={() => setShowGoogleDrivePicker(true)}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-primary)] hover:border-[#FF1B7E] text-[var(--text-primary)] h-24"
                    variant="outline"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 text-[var(--text-secondary)]" />
                      <span className="text-sm">Seleccionar desde Google Drive</span>
                    </div>
                  </Button>
                )}
              </div>
              
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-blue-300">
                  💡 Puedes omitir este paso y agregar el brief más tarde desde la sección de documentos del proyecto
                </p>
              </div>
            </div>
          )}
          
          <GoogleDrivePicker
            isOpen={showGoogleDrivePicker}
            onClose={() => setShowGoogleDrivePicker(false)}
            onSelect={(file) => {
              setSelectedBrief(file);
              setShowGoogleDrivePicker(false);
            }}
          />
          
          <DialogFooter className="mt-6 flex justify-between">
            <div>
              {(currentStep === 2 || currentStep === 3) && (
                <Button type="button" onClick={handleBack} className="bg-white hover:bg-gray-100 text-black border-white">
                  Atrás
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" onClick={onClose} className="bg-white hover:bg-gray-100 text-black border-white">
                Cancelar
              </Button>
              {currentStep === 1 ? (
                <Button type="button" onClick={handleNext} disabled={!isStep1Valid} className="bg-[#FF1B7E] hover:bg-[#e6156e] text-white">
                  Siguiente
                </Button>
              ) : currentStep === 2 ? (
                <Button type="button" onClick={handleNext} disabled={!isStep2Valid} className="bg-[#FF1B7E] hover:bg-[#e6156e] text-white">
                  Siguiente
                </Button>
              ) : (
                <Button type="submit" disabled={!isValid || isLoading} className="bg-[#FF1B7E] hover:bg-[#e6156e] text-white">
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {isEditing ? 'Guardar Cambios' : 'Crear Proyecto'}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}