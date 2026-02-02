import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import AccessItemCard from './AccessItemCard';
import ShareAccessItemModal from './ShareAccessItemModal';
import BulkAccessUpload from './BulkAccessUpload';

export default function ProjectAccessTab({ projectId, project }) {
  const [editingItemId, setEditingItemId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [sharingItem, setSharingItem] = useState(null);
  const queryClient = useQueryClient();

  const { data: accessItems = [], isLoading } = useQuery({
    queryKey: ['access-items', projectId],
    queryFn: async () => {
      return await base44.entities.ProjectAccessItem.filter({ project_id: projectId });
    },
    enabled: !!projectId
  });

  const { data: tokens = [] } = useQuery({
    queryKey: ['access-tokens', projectId],
    queryFn: async () => {
      return await base44.entities.ProjectAccessToken.filter({ project_id: projectId });
    },
    enabled: !!projectId
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ProjectAccessItem.create({ ...data, project_id: projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-items', projectId] });
      setIsCreating(false);
      toast.success('Acceso creado');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProjectAccessItem.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-items', projectId] });
      setEditingItemId(null);
      toast.success('Acceso actualizado');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProjectAccessItem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-items', projectId] });
      toast.success('Acceso eliminado');
    }
  });

  const revokeTokenMutation = useMutation({
    mutationFn: async (tokenId) => {
      return await base44.entities.ProjectAccessToken.update(tokenId, { is_revoked: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-tokens', projectId] });
      toast.success('Token revocado');
    }
  });

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF1B7E] mx-auto" />
        <p className="text-sm text-[var(--text-secondary)] mt-4">Cargando accesos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Gestión de Accesos</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {accessItems.length} acceso{accessItems.length !== 1 ? 's' : ''} registrado{accessItems.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-[#FF1B7E] hover:bg-[#e6156e]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Acceso
        </Button>
      </div>

      {/* Carga masiva */}
      <BulkAccessUpload projectId={projectId} />

      {/* Tokens activos */}
      {tokens.filter(t => !t.is_revoked && t.access_item_id).length > 0 && (
        <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Accesos Compartidos Activos</h3>
            <div className="space-y-2">
              {tokens.filter(t => !t.is_revoked && t.access_item_id).map(token => {
                const item = accessItems.find(i => i.id === token.access_item_id);
                return (
                  <div key={token.id} className="flex items-center justify-between bg-[var(--bg-tertiary)] p-3 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {item?.title || 'Acceso'} → {token.recipient_name}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {token.recipient_email} • Accedido {token.access_count || 0} veces • 
                        Expira: {new Date(token.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => revokeTokenMutation.mutate(token.id)}
                      className="text-red-500"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Revocar
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nuevo acceso en creación */}
      {isCreating && (
        <AccessItemCard
          item={null}
          isEditing={true}
          onUpdate={(data) => createMutation.mutate(data)}
          onEditToggle={() => setIsCreating(false)}
        />
      )}

      {/* Lista de accesos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accessItems.map(item => (
          <AccessItemCard
            key={item.id}
            item={item}
            isEditing={editingItemId === item.id}
            onUpdate={(data) => updateMutation.mutate({ id: item.id, data })}
            onDelete={(id) => {
              if (confirm('¿Eliminar este acceso?')) {
                deleteMutation.mutate(id);
              }
            }}
            onShare={(item) => setSharingItem(item)}
            onEditToggle={() => setEditingItemId(editingItemId === item.id ? null : item.id)}
          />
        ))}
      </div>

      {accessItems.length === 0 && !isCreating && (
        <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
          <CardContent className="py-12 text-center">
            <p className="text-[var(--text-secondary)]">No hay accesos registrados</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              Crea uno manualmente o carga varios desde CSV
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal compartir */}
      <ShareAccessItemModal
        isOpen={!!sharingItem}
        onClose={() => setSharingItem(null)}
        accessItem={sharingItem}
        projectId={projectId}
        projectName={project?.name}
      />
    </div>
  );
}