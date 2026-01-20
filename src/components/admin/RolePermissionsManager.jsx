import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ROLE_CONFIG } from '../checklist/checklistTemplates';
import { Save, Shield } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_PERMISSIONS = {
  developer: {
    can_access_dashboard: true,
    can_access_projects: true,
    can_create_projects: false,
    can_edit_projects: false,
    can_delete_projects: false,
    can_access_resources: false,
    can_access_schedules: false,
    can_access_team: false,
    can_access_reports: false,
    can_view_reports: false,
    can_access_admin: false,
    can_approve_phases: false,
    can_resolve_conflicts: false,
    can_access_global_access: false
  },
  qa: {
    can_access_dashboard: true,
    can_access_projects: true,
    can_create_projects: false,
    can_edit_projects: false,
    can_delete_projects: false,
    can_access_resources: false,
    can_access_schedules: false,
    can_access_team: false,
    can_access_reports: false,
    can_view_reports: false,
    can_access_admin: false,
    can_approve_phases: false,
    can_resolve_conflicts: false,
    can_access_global_access: false
  },
  web_leader: {
    can_access_dashboard: true,
    can_access_projects: true,
    can_create_projects: true,
    can_edit_projects: true,
    can_delete_projects: false,
    can_access_resources: true,
    can_access_schedules: true,
    can_access_team: true,
    can_access_reports: true,
    can_view_reports: true,
    can_access_admin: false,
    can_approve_phases: false,
    can_resolve_conflicts: true,
    can_access_global_access: false
  },
  product_owner: {
    can_access_dashboard: true,
    can_access_projects: true,
    can_create_projects: true,
    can_edit_projects: true,
    can_delete_projects: true,
    can_access_resources: true,
    can_access_schedules: true,
    can_access_team: true,
    can_access_reports: true,
    can_view_reports: true,
    can_access_admin: false,
    can_approve_phases: true,
    can_resolve_conflicts: true,
    can_access_global_access: true
  },
  administrador: {
    can_access_dashboard: true,
    can_access_projects: true,
    can_create_projects: true,
    can_edit_projects: true,
    can_delete_projects: true,
    can_access_resources: true,
    can_access_schedules: true,
    can_access_team: true,
    can_access_reports: true,
    can_view_reports: true,
    can_access_admin: true,
    can_approve_phases: true,
    can_resolve_conflicts: true,
    can_access_global_access: true
  }
};

const PERMISSION_LABELS = {
  can_access_dashboard: 'Acceder al dashboard',
  can_access_projects: 'Ver proyectos',
  can_create_projects: 'Crear proyectos',
  can_edit_projects: 'Editar proyectos',
  can_delete_projects: 'Eliminar proyectos',
  can_access_resources: 'Ver ocupación de recursos',
  can_access_schedules: 'Ver cronogramas',
  can_access_team: 'Gestionar equipo',
  can_access_reports: 'Acceder a reportes',
  can_view_reports: 'Ver estadísticas de reportes',
  can_access_admin: 'Acceso al panel admin',
  can_approve_phases: 'Aprobar fases',
  can_resolve_conflicts: 'Resolver conflictos',
  can_access_global_access: 'Acceder a Accesos Globales'
};

export default function RolePermissionsManager() {
  const [editedPermissions, setEditedPermissions] = useState({});
  const queryClient = useQueryClient();

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ['role-permissions'],
    queryFn: () => base44.entities.RolePermission.list()
  });

  const createPermissionMutation = useMutation({
    mutationFn: (data) => base44.entities.RolePermission.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast.success('Permisos guardados');
    }
  });

  const updatePermissionMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.RolePermission.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast.success('Permisos actualizados');
    }
  });

  const handlePermissionChange = (role, permission, value) => {
    setEditedPermissions(prev => ({
      ...prev,
      [role]: {
        ...(prev[role] || {}),
        [permission]: value
      }
    }));
  };

  const handleSave = async (role) => {
    const rolePermission = permissions.find(p => p.role === role);
    const currentPermissions = rolePermission || DEFAULT_PERMISSIONS[role] || {};
    const updates = editedPermissions[role] || {};
    const finalPermissions = { ...currentPermissions, ...updates, role };

    if (rolePermission) {
      await updatePermissionMutation.mutateAsync({ id: rolePermission.id, data: finalPermissions });
    } else {
      await createPermissionMutation.mutateAsync(finalPermissions);
    }

    setEditedPermissions(prev => {
      const newState = { ...prev };
      delete newState[role];
      return newState;
    });
  };

  const getPermissionValue = (role, permission) => {
    if (editedPermissions[role]?.[permission] !== undefined) {
      return editedPermissions[role][permission];
    }
    const rolePermission = permissions.find(p => p.role === role);
    if (rolePermission?.[permission] !== undefined) {
      return rolePermission[permission];
    }
    return DEFAULT_PERMISSIONS[role]?.[permission] || false;
  };

  const hasChanges = (role) => {
    return editedPermissions[role] && Object.keys(editedPermissions[role]).length > 0;
  };

  return (
    <div className="space-y-4">
      {Object.entries(ROLE_CONFIG).map(([roleKey, roleConfig]) => (
        <Card key={roleKey} className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 text-[var(--text-primary)]">
                <Shield className="h-4 w-4 text-[#FF1B7E]" />
                <Badge className={`${roleConfig.color} text-white border-0`}>
                  {roleConfig.name}
                </Badge>
              </CardTitle>
              {hasChanges(roleKey) && (
                <Button
                  size="sm"
                  onClick={() => handleSave(roleKey)}
                  disabled={createPermissionMutation.isPending || updatePermissionMutation.isPending}
                  className="bg-[#FF1B7E] hover:bg-[#e6156e] text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(PERMISSION_LABELS).map(([permission, label]) => (
                <div key={permission} className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-secondary)]">
                  <Label htmlFor={`${roleKey}-${permission}`} className="text-sm text-[var(--text-primary)] cursor-pointer">
                    {label}
                  </Label>
                  <Switch
                    id={`${roleKey}-${permission}`}
                    checked={getPermissionValue(roleKey, permission)}
                    onCheckedChange={(checked) => handlePermissionChange(roleKey, permission, checked)}
                    className="data-[state=checked]:bg-[#FF1B7E]"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}