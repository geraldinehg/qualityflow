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
import { Users, UserPlus, Pencil, Trash2, Shield, Wrench, Plus, Settings } from 'lucide-react';
import { ROLE_CONFIG } from '../checklist/checklistTemplates';

export default function AdminPanel({ isOpen, onClose }) {
  const [newMember, setNewMember] = useState({ user_email: '', display_name: '', role: 'developer' });
  const [editingMember, setEditingMember] = useState(null);
  const [newTechnology, setNewTechnology] = useState({ name: '', key: '', color: 'bg-slate-500' });
  const [editingTechnology, setEditingTechnology] = useState(null);
  
  const queryClient = useQueryClient();
  
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => base44.entities.TeamMember.list('-created_date'),
    enabled: isOpen
  });
  
  const { data: customTechnologies = [] } = useQuery({
    queryKey: ['custom-technologies'],
    queryFn: () => base44.entities.Technology.list('-created_date'),
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
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border-[#2a2a2a] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2 text-white">
            <Shield className="h-5 w-5 text-[#FF1B7E]" />
            Panel de Administración
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="members" className="mt-4">
          <TabsList className="grid w-full grid-cols-4 bg-[#0a0a0a] border-[#2a2a2a]">
            <TabsTrigger value="members" className="data-[state=active]:bg-[#FF1B7E] data-[state=active]:text-white text-gray-400">
              <Users className="h-4 w-4 mr-2" />
              Miembros del Equipo
            </TabsTrigger>
            <TabsTrigger value="technologies" className="data-[state=active]:bg-[#FF1B7E] data-[state=active]:text-white text-gray-400">
              <Wrench className="h-4 w-4 mr-2" />
              Tecnologías
            </TabsTrigger>
            <TabsTrigger value="configuration" className="data-[state=active]:bg-[#FF1B7E] data-[state=active]:text-white text-gray-400">
              <Settings className="h-4 w-4 mr-2" />
              Configuración
            </TabsTrigger>
            <TabsTrigger value="roles" className="data-[state=active]:bg-[#FF1B7E] data-[state=active]:text-white text-gray-400">
              <Shield className="h-4 w-4 mr-2" />
              Roles y Permisos
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="members" className="space-y-6 mt-6">
            {/* Crear nuevo miembro */}
            <Card className="bg-[#0a0a0a] border-[#2a2a2a]">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-white">
                  <UserPlus className="h-4 w-4 text-[#FF1B7E]" />
                  Agregar Nuevo Miembro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateMember} className="space-y-4">
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
              </CardContent>
            </Card>
            
            {/* Lista de miembros activos */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">Miembros Activos ({activeMembers.length})</h3>
              <div className="space-y-2">
                {activeMembers.map((member) => {
                  const roleConfig = ROLE_CONFIG[member.role];
                  const isEditing = editingMember?.id === member.id;
                  
                  return (
                    <Card key={member.id} className="bg-[#0a0a0a] border-[#2a2a2a]">
                      <CardContent className="py-3">
                        {isEditing ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                              <Input
                                value={editingMember.display_name || ''}
                                onChange={(e) => setEditingMember({ ...editingMember, display_name: e.target.value })}
                                placeholder="Nombre"
                              />
                              <Select
                                value={editingMember.role}
                                onValueChange={(value) => setEditingMember({ ...editingMember, role: value })}
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
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateMember(member, editingMember)}
                                  disabled={updateMemberMutation.isPending}
                                  className="bg-white hover:bg-gray-100 text-black"
                                >
                                  Guardar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingMember(null)}
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
                              <div className="w-10 h-10 rounded-full bg-[#FF1B7E]/10 flex items-center justify-center">
                                <Users className="h-5 w-5 text-[#FF1B7E]" />
                              </div>
                              <div>
                                <p className="font-medium text-white">
                                  {member.display_name || member.user_email}
                                </p>
                                <p className="text-sm text-gray-400">{member.user_email}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <Badge className={`${roleConfig?.color || 'bg-slate-600'} text-white border-0`}>
                                {roleConfig?.name || member.role}
                              </Badge>
                              
                              <div className="flex gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() => setEditingMember(member)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-red-600 hover:text-red-700"
                                  onClick={() => {
                                    if (confirm('¿Desactivar este miembro?')) {
                                      handleUpdateMember(member, { is_active: false });
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
            
            {/* Miembros inactivos */}
            {inactiveMembers.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-400">Miembros Inactivos ({inactiveMembers.length})</h3>
                <div className="space-y-2">
                  {inactiveMembers.map((member) => (
                    <Card key={member.id} className="opacity-60 bg-[#0a0a0a] border-[#2a2a2a]">
                      <CardContent className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <p className="text-sm text-gray-400">{member.display_name || member.user_email}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateMember(member, { is_active: true })}
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
          </TabsContent>
          
          <TabsContent value="technologies" className="space-y-6 mt-6">
            {/* Crear nueva tecnología */}
            <Card className="bg-[#0a0a0a] border-[#2a2a2a]">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-white">
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
              <h3 className="text-sm font-semibold text-white">Tecnologías Personalizadas ({activeTechnologies.length})</h3>
              <div className="space-y-2">
                {activeTechnologies.map((tech) => {
                  const isEditing = editingTechnology?.id === tech.id;
                  
                  return (
                    <Card key={tech.id} className="bg-[#0a0a0a] border-[#2a2a2a]">
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
                                <p className="font-medium text-white">{tech.name}</p>
                                <p className="text-sm text-gray-400">{tech.key}</p>
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
                <h3 className="text-sm font-semibold text-gray-400">Tecnologías Inactivas ({inactiveTechnologies.length})</h3>
                <div className="space-y-2">
                  {inactiveTechnologies.map((tech) => (
                    <Card key={tech.id} className="opacity-60 bg-[#0a0a0a] border-[#2a2a2a]">
                      <CardContent className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <p className="text-sm text-gray-400">{tech.name}</p>
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
              <strong>ℹ️ Información sobre roles:</strong> Los roles determinan qué acciones puede realizar cada miembro del equipo en los proyectos.
            </div>
            
            <div className="space-y-3">
              {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                <Card key={key} className="bg-[#0a0a0a] border-[#2a2a2a]">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Badge className={`${config.color} text-white border-0`}>
                        {config.name}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-300">
                        <strong>Permisos:</strong>
                      </p>
                      <ul className="text-sm text-gray-400 list-disc list-inside space-y-1">
                        {config.canComplete && <li>Puede marcar ítems como completados</li>}
                        {config.canReportConflicts && <li>Puede reportar conflictos</li>}
                        {key === 'web_leader' && <li>Puede resolver conflictos</li>}
                        {key === 'product_owner' && <li>Puede aprobar entregas</li>}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}