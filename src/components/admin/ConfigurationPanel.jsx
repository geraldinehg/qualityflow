import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Briefcase, DollarSign, Building2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';

export default function ConfigurationPanel() {
  const [newProjectType, setNewProjectType] = useState({ name: '', key: '', description: '', color: 'bg-blue-500' });
  const [newFeeType, setNewFeeType] = useState({ name: '', key: '' });
  const [newClient, setNewClient] = useState({ name: '', contact_email: '', contact_phone: '', notes: '' });
  const [editingItem, setEditingItem] = useState(null);

  const queryClient = useQueryClient();

  const { data: projectTypes = [] } = useQuery({
    queryKey: ['project-types'],
    queryFn: () => base44.entities.ProjectType.filter({ is_active: true })
  });

  const { data: feeTypes = [] } = useQuery({
    queryKey: ['fee-types'],
    queryFn: () => base44.entities.FeeType.filter({ is_active: true })
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.filter({ is_active: true })
  });

  const createProjectTypeMutation = useMutation({
    mutationFn: (data) => base44.entities.ProjectType.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-types'] });
      setNewProjectType({ name: '', key: '', description: '', color: 'bg-blue-500' });
      toast.success('Tipo de proyecto creado');
    }
  });

  const createFeeTypeMutation = useMutation({
    mutationFn: (data) => base44.entities.FeeType.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-types'] });
      setNewFeeType({ name: '', key: '' });
      toast.success('Tipo de fee creado');
    }
  });

  const createClientMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setNewClient({ name: '', contact_email: '', contact_phone: '', notes: '' });
      toast.success('Cliente creado');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ entity, id, data }) => base44.entities[entity].update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`${variables.entity.toLowerCase()}-s`] });
      setEditingItem(null);
      toast.success('Actualizado correctamente');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: ({ entity, id }) => base44.entities[entity].update(id, { is_active: false }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`${variables.entity.toLowerCase()}-s`] });
      toast.success('Desactivado');
    }
  });

  return (
    <Tabs defaultValue="project-types" className="space-y-4">
      <TabsList className="grid w-full grid-cols-3 bg-[#0a0a0a] border-[#2a2a2a]">
        <TabsTrigger value="project-types" className="data-[state=active]:bg-[#FF1B7E] data-[state=active]:text-white text-gray-400">
          <Briefcase className="h-4 w-4 mr-2" />
          Tipos de Proyecto
        </TabsTrigger>
        <TabsTrigger value="fee-types" className="data-[state=active]:bg-[#FF1B7E] data-[state=active]:text-white text-gray-400">
          <DollarSign className="h-4 w-4 mr-2" />
          Tipos de Fee
        </TabsTrigger>
        <TabsTrigger value="clients" className="data-[state=active]:bg-[#FF1B7E] data-[state=active]:text-white text-gray-400">
          <Building2 className="h-4 w-4 mr-2" />
          Clientes
        </TabsTrigger>
      </TabsList>

      <TabsContent value="project-types" className="space-y-4">
        <Card className="bg-[#0a0a0a] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-base text-white">Agregar Tipo de Proyecto</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); createProjectTypeMutation.mutate(newProjectType); }} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nombre *</Label>
                  <Input
                    value={newProjectType.name}
                    onChange={(e) => setNewProjectType({ ...newProjectType, name: e.target.value })}
                    placeholder="Ej: Marketing"
                  />
                </div>
                <div>
                  <Label>Clave *</Label>
                  <Input
                    value={newProjectType.key}
                    onChange={(e) => setNewProjectType({ ...newProjectType, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    placeholder="Ej: marketing"
                  />
                </div>
              </div>
              <div>
                <Label>Descripción</Label>
                <Input
                  value={newProjectType.description}
                  onChange={(e) => setNewProjectType({ ...newProjectType, description: e.target.value })}
                  placeholder="Descripción breve"
                />
              </div>
              <Button type="submit" disabled={!newProjectType.name || !newProjectType.key} className="bg-white hover:bg-gray-100 text-black">
                <Plus className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {projectTypes.map((type) => (
            <Card key={type.id} className="bg-[#0a0a0a] border-[#2a2a2a]">
              <CardContent className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{type.name}</p>
                  <p className="text-sm text-gray-400">{type.description || type.key}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-red-600"
                  onClick={() => deleteMutation.mutate({ entity: 'ProjectType', id: type.id })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="fee-types" className="space-y-4">
        <Card className="bg-[#0a0a0a] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-base text-white">Agregar Tipo de Fee</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); createFeeTypeMutation.mutate(newFeeType); }} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nombre *</Label>
                  <Input
                    value={newFeeType.name}
                    onChange={(e) => setNewFeeType({ ...newFeeType, name: e.target.value })}
                    placeholder="Ej: PEI"
                  />
                </div>
                <div>
                  <Label>Clave *</Label>
                  <Input
                    value={newFeeType.key}
                    onChange={(e) => setNewFeeType({ ...newFeeType, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    placeholder="Ej: pei"
                  />
                </div>
              </div>
              <Button type="submit" disabled={!newFeeType.name || !newFeeType.key} className="bg-white hover:bg-gray-100 text-black">
                <Plus className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {feeTypes.map((type) => (
            <Card key={type.id} className="bg-[#0a0a0a] border-[#2a2a2a]">
              <CardContent className="py-3 flex items-center justify-between">
                <p className="font-medium text-white">{type.name}</p>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-red-600"
                  onClick={() => deleteMutation.mutate({ entity: 'FeeType', id: type.id })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="clients" className="space-y-4">
        <Card className="bg-[#0a0a0a] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-base text-white">Agregar Cliente/Sociedad</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); createClientMutation.mutate(newClient); }} className="space-y-3">
              <div>
                <Label>Nombre *</Label>
                <Input
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  placeholder="Nombre del cliente"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Email de contacto</Label>
                  <Input
                    type="email"
                    value={newClient.contact_email}
                    onChange={(e) => setNewClient({ ...newClient, contact_email: e.target.value })}
                    placeholder="email@cliente.com"
                  />
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <Input
                    value={newClient.contact_phone}
                    onChange={(e) => setNewClient({ ...newClient, contact_phone: e.target.value })}
                    placeholder="+57 300 123 4567"
                  />
                </div>
              </div>
              <div>
                <Label>Notas</Label>
                <Textarea
                  value={newClient.notes}
                  onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                  placeholder="Notas adicionales"
                  className="h-20"
                />
              </div>
              <Button type="submit" disabled={!newClient.name} className="bg-white hover:bg-gray-100 text-black">
                <Plus className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {clients.map((client) => (
            <Card key={client.id} className="bg-[#0a0a0a] border-[#2a2a2a]">
              <CardContent className="py-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-white">{client.name}</p>
                    {client.contact_email && (
                      <p className="text-sm text-gray-400">{client.contact_email}</p>
                    )}
                    {client.contact_phone && (
                      <p className="text-sm text-gray-400">{client.contact_phone}</p>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-red-600"
                    onClick={() => deleteMutation.mutate({ entity: 'Client', id: client.id })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}