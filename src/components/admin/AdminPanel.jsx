import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ConfigurationPanel from './ConfigurationPanel';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, UserPlus, Pencil, Trash2, Shield, Wrench, Plus, Settings, TrendingUp, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { ROLE_CONFIG } from '../checklist/checklistTemplates';
import { Progress } from "@/components/ui/progress";
import RolePermissionsManager from './RolePermissionsManager';

export default function AdminPanel({ isOpen, onClose, defaultTab = 'members' }) {
  const [newMember, setNewMember] = useState({ user_email: '', display_name: '', role: 'developer' });
  const [editingMember, setEditingMember] = useState(null);
  const [newTechnology, setNewTechnology] = useState({ name: '', key: '', color: 'bg-slate-500' });
  const [editingTechnology, setEditingTechnology] = useState(null);
  const [editingStatsRole, setEditingStatsRole] = useState(null);
  
  const queryClient = useQueryClient();
  
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => base44.entities.TeamMember.list('-created_date'),
    enabled: isOpen
  });
  
  const { data: systemUsers = [] } = useQuery({
    queryKey: ['system-users'],
    queryFn: async () => {
      const users = await base44.entities.User.list('-created_date');
      return users;
    },
    enabled: isOpen
  });
  
  const { data: customTechnologies = [] } = useQuery({
    queryKey: ['custom-technologies'],
    queryFn: () => base44.entities.Technology.list('-created_date'),
    enabled: isOpen
  });
  
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date'),
    enabled: isOpen
  });
  
  const { data: checklistItems = [] } = useQuery({
    queryKey: ['all-checklist-items'],
    queryFn: () => base44.entities.ChecklistItem.list('-created_date'),
    enabled: isOpen
  });
  
  const createMemberMutation = useMutation({
    mutationFn: (data) => base44.entities.TeamMember.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      setNewMember({ user_email: '', display_name: '', role: 'developer' });
    }
  });
  
  const updateMemberMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TeamMember.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      setEditingMember(null);
    }
  });
  
  const deleteMemberMutation = useMutation({
    mutationFn: (id) => base44.entities.TeamMember.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    }
  });
  
  const createTechnologyMutation = useMutation({
    mutationFn: (data) => base44.entities.Technology.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-technologies'] });
      setNewTechnology({ name: '', key: '', color: 'bg-slate-500' });
    }
  });
  
  const updateTechnologyMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Technology.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-technologies'] });
      setEditingTechnology(null);
    }
  });
  
  const deleteTechnologyMutation = useMutation({
    mutationFn: (id) => base44.entities.Technology.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-technologies'] });
    }
  });
  
  const handleCreateMember = (e) => {
    e.preventDefault();
    if (newMember.user_email && newMember.role) {
      createMemberMutation.mutate(newMember);
    }
  };
  
  const handleUpdateMember = (member, updates) => {
    updateMemberMutation.mutate({ id: member.id, data: updates });
  };
  
  const handleCreateTechnology = (e) => {
    e.preventDefault();
    if (newTechnology.name && newTechnology.key) {
      createTechnologyMutation.mutate(newTechnology);
    }
  };
  
  const handleUpdateTechnology = (tech, updates) => {
    updateTechnologyMutation.mutate({ id: tech.id, data: updates });
  };
  
  const activeMembers = teamMembers.filter(m => m.is_active);
  const inactiveMembers = teamMembers.filter(m => !m.is_active);
  const activeTechnologies = customTechnologies.filter(t => t.is_active);
  const inactiveTechnologies = customTechnologies.filter(t => !t.is_active);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-primary)]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2 text-[var(--text-primary)]">
            <Shield className="h-5 w-5 text-[#FF1B7E]" />
            Panel de Administración
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue={defaultTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-5 bg-[var(--bg-primary)] border-[var(--border-primary)]">
            <TabsTrigger value="members" className="data-[state=active]:bg-[#FF1B7E] data-[state=active]:text-white text-[var(--text-secondary)]">
              <Users className="h-4 w-4 mr-2" />
              Miembros
            </TabsTrigger>
            <TabsTrigger value="statistics" className="data-[state=active]:bg-[#FF1B7E] data-[state=active]:text-white text-[var(--text-secondary)]">
              <Users className="h-4 w-4 mr-2" />
              Estadísticas
            </TabsTrigger>
            <TabsTrigger value="technologies" className="data-[state=active]:bg-[#FF1B7E] data-[state=active]:text-white text-[var(--text-secondary)]">
              <Wrench className="h-4 w-4 mr-2" />
              Tecnologías
            </TabsTrigger>
            <TabsTrigger value="configuration" className="data-[state=active]:bg-[#FF1B7E] data-[state=active]:text-white text-[var(--text-secondary)]">
              <Settings className="h-4 w-4 mr-2" />
              Configuración
            </TabsTrigger>
            <TabsTrigger value="roles" className="data-[state=active]:bg-[#FF1B7E] data-[state=active]:text-white text-[var(--text-secondary)]">
              <Shield className="h-4 w-4 mr-2" />
              Roles
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="members" className="space-y-6 mt-6">
            {/* Usuarios del Sistema */}
            <Card className="bg-[var(--bg-primary)] border-[var(--border-primary)]">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-[var(--text-primary)]">
                  <Users className="h-4 w-4 text-[#FF1B7E]" />
                  Usuarios del Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-[var(--text-secondary)]">
                    Todos los usuarios registrados en el sistema. Asigna un rol a cada usuario para definir sus permisos.
                  </p>
                  
                  <div className="space-y-2">
                    {systemUsers.map((user) => {
                      const member = teamMembers.find(m => m.user_email === user.email);
                      const currentRole = member?.role || 'sin_asignar';
                      const roleConfig = ROLE_CONFIG[currentRole];
                      const isEditing = editingMember?.email === user.email;
                      
                      return (
                        <Card key={user.id} className="bg-[var(--bg-secondary)] border-[var(--border-secondary)]">
                          <CardContent className="py-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#FF1B7E]/10 flex items-center justify-center">
                                  <Users className="h-5 w-5 text-[#FF1B7E]" />
                                </div>
                                <div>
                                  <p className="font-medium text-[var(--text-primary)]">
                                    {user.full_name || user.email}
                                  </p>
                                  <p className="text-sm text-[var(--text-secondary)]">{user.email}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                {isEditing ? (
                                  <div className="flex items-center gap-2">
                                    <Select
                                      value={editingMember.role}
                                      onValueChange={(value) => setEditingMember({ ...editingMember, role: value })}
                                    >
                                      <SelectTrigger className="w-48">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                                          <SelectItem key={key} value={key}>{config.name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Button
                                      size="sm"
                                      onClick={async () => {
                                        if (member) {
                                          await updateMemberMutation.mutateAsync({ 
                                            id: member.id, 
                                            data: { role: editingMember.role } 
                                          });
                                        } else {
                                          await createMemberMutation.mutateAsync({
                                            user_email: user.email,
                                            display_name: user.full_name,
                                            role: editingMember.role,
                                            is_active: true
                                          });
                                        }
                                        setEditingMember(null);
                                      }}
                                      disabled={updateMemberMutation.isPending || createMemberMutation.isPending}
                                      className="bg-white hover:bg-gray-100 text-black"
                                    >
                                      Guardar
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setEditingMember(null)}
                                    >
                                      ✕
                                    </Button>
                                  </div>
                                ) : (
                                  <>
                                    <Badge className={`${roleConfig?.color || 'bg-gray-600'} text-white border-0`}>
                                      {roleConfig?.name || 'Sin asignar'}
                                    </Badge>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8"
                                      onClick={() => setEditingMember({ email: user.email, role: currentRole })}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Configuración de Roles (TeamMembers del equipo técnico) */}
            <Card className="bg-[var(--bg-primary)] border-[var(--border-primary)]">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-[var(--text-primary)]">
                  <UserPlus className="h-4 w-4 text-[#FF1B7E]" />
                  Miembros del Equipo Técnico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Miembros técnicos adicionales para asignar como responsables en fases y áreas específicas.
                </p>
                
                <form onSubmit={handleCreateMember} className="space-y-4 mb-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newMember.user_email}
                        onChange={(e) => setNewMember({ ...newMember, user_email: e.target.value })}
                        placeholder="usuario@ejemplo.com"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Nombre para mostrar</Label>
                      <Input
                        id="displayName"
                        value={newMember.display_name}
                        onChange={(e) => setNewMember({ ...newMember, display_name: e.target.value })}
                        placeholder="Juan Pérez"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="role">Rol *</Label>
                      <Select
                        value={newMember.role}
                        onValueChange={(value) => setNewMember({ ...newMember, role: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                            <SelectItem key={key} value={key}>{config.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={!newMember.user_email || !newMember.role || createMemberMutation.isPending}
                    className="bg-white hover:bg-gray-100 text-black"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Agregar Miembro
                  </Button>
                </form>
                
                <div className="space-y-2">
                  {activeMembers.map((member) => {
                    const roleConfig = ROLE_CONFIG[member.role];
                    
                    return (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-secondary)]">
                        <div className="flex items-center gap-3">
                          <p className="text-sm text-[var(--text-primary)]">{member.display_name || member.user_email}</p>
                          <Badge className={`${roleConfig?.color || 'bg-slate-600'} text-white border-0 text-xs`}>
                            {roleConfig?.name || member.role}
                          </Badge>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => {
                            if (confirm('¿Eliminar este miembro?')) {
                              deleteMemberMutation.mutate(member.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="statistics" className="space-y-6 mt-6">
            {/* Estadísticas por miembro */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Estadísticas de Rendimiento</h3>
              
              {activeMembers.map((member) => {
                // Obtener proyectos donde es responsable
                const memberProjects = projects.filter(p => {
                  const phaseResponsibles = p.phase_responsibles || {};
                  return Object.values(phaseResponsibles).some(emails => 
                    Array.isArray(emails) ? emails.includes(member.user_email) : emails === member.user_email
                  ) || (p.area_responsibles && Object.values(p.area_responsibles).includes(member.user_email));
                });
                
                // Obtener checklist items donde es responsable
                const memberItems = checklistItems.filter(item => {
                  const project = projects.find(p => p.id === item.project_id);
                  if (!project) return false;
                  
                  const phaseResponsibles = project.phase_responsibles?.[item.phase] || [];
                  return Array.isArray(phaseResponsibles) 
                    ? phaseResponsibles.includes(member.user_email)
                    : phaseResponsibles === member.user_email;
                });
                
                const completedItems = memberItems.filter(i => i.status === 'completed');
                const pendingItems = memberItems.filter(i => i.status === 'pending' || i.status === 'in_progress');
                const criticalPending = memberItems.filter(i => (i.status === 'pending' || i.status === 'in_progress') && (i.weight === 'critical' || i.weight === 'high'));
                const completionRate = memberItems.length > 0 ? (completedItems.length / memberItems.length) * 100 : 0;
                
                const roleConfig = ROLE_CONFIG[member.role];
                
                return (
                  <Card key={member.id} className="bg-[var(--bg-primary)] border-[var(--border-primary)]">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-[#FF1B7E]/10 flex items-center justify-center">
                            <Users className="h-6 w-6 text-[#FF1B7E]" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-[var(--text-primary)] text-lg">
                              {member.display_name || member.user_email}
                            </p>
                            {editingStatsRole?.id === member.id ? (
                              <div className="flex items-center gap-2 mt-1">
                                <Select
                                  value={editingStatsRole.role}
                                  onValueChange={(value) => setEditingStatsRole({ ...editingStatsRole, role: value })}
                                >
                                  <SelectTrigger className="w-48 h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                                      <SelectItem key={key} value={key}>{config.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    handleUpdateMember(member, { role: editingStatsRole.role });
                                    setEditingStatsRole(null);
                                  }}
                                  className="h-8 bg-white hover:bg-gray-100 text-black"
                                >
                                  Guardar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingStatsRole(null)}
                                  className="h-8"
                                >
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={`${roleConfig?.color || 'bg-slate-600'} text-white border-0`}>
                                  {roleConfig?.name || member.role}
                                </Badge>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() => setEditingStatsRole(member)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-3xl font-bold text-[#FF1B7E]">
                            {Math.round(completionRate)}%
                          </p>
                          <p className="text-xs text-[var(--text-secondary)]">Tasa de cumplimiento</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Barra de progreso */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--text-secondary)]">Progreso general</span>
                          <span className="text-[var(--text-primary)] font-medium">
                            {completedItems.length} / {memberItems.length} ítems
                          </span>
                        </div>
                        <Progress value={completionRate} className="h-2 bg-[var(--bg-tertiary)] [&>div]:bg-[#FF1B7E]" />
                      </div>
                      
                      {/* Estadísticas */}
                      <div className="grid grid-cols-4 gap-4">
                        <div className="bg-[var(--bg-secondary)] rounded-lg p-3 border border-[var(--border-secondary)]">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="h-4 w-4 text-blue-400" />
                            <p className="text-xs text-[var(--text-secondary)]">Proyectos</p>
                          </div>
                          <p className="text-2xl font-bold text-[var(--text-primary)]">{memberProjects.length}</p>
                        </div>
                        
                        <div className="bg-[var(--bg-secondary)] rounded-lg p-3 border border-[var(--border-secondary)]">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="h-4 w-4 text-green-400" />
                            <p className="text-xs text-[var(--text-secondary)]">Completados</p>
                          </div>
                          <p className="text-2xl font-bold text-green-400">{completedItems.length}</p>
                        </div>
                        
                        <div className="bg-[var(--bg-secondary)] rounded-lg p-3 border border-[var(--border-secondary)]">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-4 w-4 text-yellow-400" />
                            <p className="text-xs text-[var(--text-secondary)]">Pendientes</p>
                          </div>
                          <p className="text-2xl font-bold text-yellow-400">{pendingItems.length}</p>
                        </div>
                        
                        <div className="bg-[var(--bg-secondary)] rounded-lg p-3 border border-[var(--border-secondary)]">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertCircle className="h-4 w-4 text-red-400" />
                            <p className="text-xs text-[var(--text-secondary)]">Críticos</p>
                          </div>
                          <p className="text-2xl font-bold text-red-400">{criticalPending.length}</p>
                        </div>
                      </div>
                      
                      {/* Lista de proyectos asignados */}
                      {memberProjects.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-[var(--text-secondary)]">Proyectos asignados:</p>
                          <div className="space-y-1">
                            {memberProjects.map(project => (
                              <div key={project.id} className="flex items-center justify-between p-2 bg-[var(--bg-secondary)] rounded border border-[var(--border-secondary)]">
                                <p className="text-sm text-[var(--text-primary)]">{project.name}</p>
                                <Badge variant="outline" className="text-xs">
                                  {Math.round(project.completion_percentage || 0)}%
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              
              {activeMembers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-[var(--text-tertiary)] mb-4" />
                  <p className="text-[var(--text-secondary)]">No hay miembros del equipo registrados</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="technologies" className="space-y-6 mt-6">
            {/* Crear nueva tecnología */}
            <Card className="bg-[var(--bg-primary)] border-[var(--border-primary)]">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-[var(--text-primary)]">
                  <Plus className="h-4 w-4 text-[#FF1B7E]" />
                  Agregar Nueva Tecnología
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTechnology} className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="techName">Nombre *</Label>
                      <Input
                        id="techName"
                        value={newTechnology.name}
                        onChange={(e) => setNewTechnology({ ...newTechnology, name: e.target.value })}
                        placeholder="Ej: Laravel"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="techKey">Identificador *</Label>
                      <Input
                        id="techKey"
                        value={newTechnology.key}
                        onChange={(e) => setNewTechnology({ ...newTechnology, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                        placeholder="Ej: laravel"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="techColor">Color</Label>
                      <Select
                        value={newTechnology.color}
                        onValueChange={(value) => setNewTechnology({ ...newTechnology, color: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bg-red-500">Rojo</SelectItem>
                          <SelectItem value="bg-orange-500">Naranja</SelectItem>
                          <SelectItem value="bg-yellow-500">Amarillo</SelectItem>
                          <SelectItem value="bg-green-500">Verde</SelectItem>
                          <SelectItem value="bg-blue-500">Azul</SelectItem>
                          <SelectItem value="bg-indigo-500">Índigo</SelectItem>
                          <SelectItem value="bg-purple-500">Púrpura</SelectItem>
                          <SelectItem value="bg-pink-500">Rosa</SelectItem>
                          <SelectItem value="bg-slate-500">Gris</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={!newTechnology.name || !newTechnology.key || createTechnologyMutation.isPending}
                    className="bg-white hover:bg-gray-100 text-black"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Tecnología
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            {/* Lista de tecnologías activas */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Tecnologías Personalizadas ({activeTechnologies.length})</h3>
              <div className="space-y-2">
                {activeTechnologies.map((tech) => {
                  const isEditing = editingTechnology?.id === tech.id;
                  
                  return (
                    <Card key={tech.id} className="bg-[var(--bg-primary)] border-[var(--border-primary)]">
                      <CardContent className="py-3">
                        {isEditing ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-4 gap-3">
                              <Input
                                value={editingTechnology.name || ''}
                                onChange={(e) => setEditingTechnology({ ...editingTechnology, name: e.target.value })}
                                placeholder="Nombre"
                              />
                              <Input
                                value={editingTechnology.key || ''}
                                onChange={(e) => setEditingTechnology({ ...editingTechnology, key: e.target.value })}
                                placeholder="Identificador"
                              />
                              <Select
                                value={editingTechnology.color}
                                onValueChange={(value) => setEditingTechnology({ ...editingTechnology, color: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="bg-red-500">Rojo</SelectItem>
                                  <SelectItem value="bg-orange-500">Naranja</SelectItem>
                                  <SelectItem value="bg-yellow-500">Amarillo</SelectItem>
                                  <SelectItem value="bg-green-500">Verde</SelectItem>
                                  <SelectItem value="bg-blue-500">Azul</SelectItem>
                                  <SelectItem value="bg-indigo-500">Índigo</SelectItem>
                                  <SelectItem value="bg-purple-500">Púrpura</SelectItem>
                                  <SelectItem value="bg-pink-500">Rosa</SelectItem>
                                  <SelectItem value="bg-slate-500">Gris</SelectItem>
                                </SelectContent>
                              </Select>
                              <div className="flex gap-2">
                               <Button
                                 size="sm"
                                 onClick={() => handleUpdateTechnology(tech, editingTechnology)}
                                 disabled={updateTechnologyMutation.isPending}
                                 className="bg-white hover:bg-gray-100 text-black"
                               >
                                 Guardar
                               </Button>
                               <Button
                                 size="sm"
                                 variant="outline"
                                 onClick={() => setEditingTechnology(null)}
                                 className="border-white hover:bg-gray-100 text-white hover:text-black"
                               >
                                 Cancelar
                               </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full ${tech.color} flex items-center justify-center`}>
                                <Wrench className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="font-medium text-[var(--text-primary)]">{tech.name}</p>
                                <p className="text-sm text-[var(--text-secondary)]">{tech.key}</p>
                              </div>
                            </div>
                            
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => setEditingTechnology(tech)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-600 hover:text-red-700"
                                onClick={() => {
                                  if (confirm('¿Desactivar esta tecnología?')) {
                                    handleUpdateTechnology(tech, { is_active: false });
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
            
            {/* Tecnologías inactivas */}
            {inactiveTechnologies.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Tecnologías Inactivas ({inactiveTechnologies.length})</h3>
                <div className="space-y-2">
                  {inactiveTechnologies.map((tech) => (
                    <Card key={tech.id} className="opacity-60 bg-[var(--bg-primary)] border-[var(--border-primary)]">
                      <CardContent className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <p className="text-sm text-[var(--text-secondary)]">{tech.name}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateTechnology(tech, { is_active: true })}
                            className="border-white hover:bg-gray-100 text-white hover:text-black"
                          >
                            Reactivar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            <div className="bg-[#FF1B7E]/10 border border-[#FF1B7E]/30 rounded-lg p-4 text-sm text-[#FF1B7E]">
              <strong>ℹ️ Nota:</strong> Las tecnologías personalizadas se sumarán a las tecnologías predeterminadas (WordPress, Webflow, Custom, Shopify).
            </div>
          </TabsContent>
          
          <TabsContent value="configuration" className="space-y-4 mt-6">
            <ConfigurationPanel />
          </TabsContent>
          
          <TabsContent value="roles" className="space-y-4 mt-6">
            <div className="bg-[#FF1B7E]/10 border border-[#FF1B7E]/30 rounded-lg p-4 text-sm text-[#FF1B7E]">
              <strong>ℹ️ Información sobre roles:</strong> Configura los permisos y accesos de cada rol en el sistema.
            </div>
            
            <RolePermissionsManager />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}