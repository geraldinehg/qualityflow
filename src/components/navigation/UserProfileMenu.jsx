import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  User, 
  LogOut, 
  Settings, 
  Briefcase, 
  Users,
  FolderKanban,
  ChevronDown
} from 'lucide-react';
import { ROLE_CONFIG } from '../checklist/checklistTemplates';
import TaskNotificationBadge from '../notifications/TaskNotificationBadge';

export default function UserProfileMenu() {
  const [user, setUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  
  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);

  const { data: teamMember } = useQuery({
    queryKey: ['team-member', user?.email],
    queryFn: () => base44.entities.TeamMember.filter({ user_email: user?.email }).then(r => r[0]),
    enabled: !!user?.email
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['user-projects', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const allProjects = await base44.entities.Project.list();
      return allProjects.filter(p => 
        p.team_members?.includes(user.email) ||
        p.product_owner_email === user.email ||
        Object.values(p.area_responsibles || {}).includes(user.email) ||
        Object.values(p.phase_responsibles || {}).flat().includes(user.email)
      );
    },
    enabled: !!user?.email
  });

  const { data: leader } = useQuery({
    queryKey: ['leader', teamMember?.role],
    queryFn: async () => {
      if (!teamMember?.role) return null;
      const leaderRole = `leader_${teamMember.role.replace('leader_', '')}`;
      const leaders = await base44.entities.TeamMember.filter({ role: leaderRole, is_active: true });
      return leaders[0];
    },
    enabled: !!teamMember?.role && !teamMember?.role.startsWith('leader_')
  });

  if (!user) return null;

  const roleConfig = ROLE_CONFIG[teamMember?.role] || {};
  const initials = user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || user.email[0].toUpperCase();

  return (
    <>
      <div className="flex items-center gap-2">
        <TaskNotificationBadge />
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-3 bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-primary)]">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-[var(--text-primary)] font-sans" style={{ fontStyle: 'normal !important', fontFamily: 'Satoshi, -apple-system, BlinkMacSystemFont, sans-serif' }}>{user.full_name || user.email}</p>
                {teamMember && (
                  <p className="text-xs text-[var(--text-secondary)] font-sans" style={{ fontStyle: 'normal !important', fontFamily: 'Satoshi, -apple-system, BlinkMacSystemFont, sans-serif' }}>{roleConfig.name || teamMember.role}</p>
                )}
              </div>
              <Avatar className="h-10 w-10 bg-[#FF1B7E]">
                <AvatarFallback className="bg-[#FF1B7E] text-white font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-4 w-4 text-[var(--text-secondary)]" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-[var(--bg-secondary)] border-[var(--border-primary)]">
          <DropdownMenuLabel className="text-[var(--text-primary)]">Mi Cuenta</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-[var(--border-primary)]" />
          <DropdownMenuItem onClick={() => setShowProfile(true)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">
            <User className="mr-2 h-4 w-4" />
            Ver Perfil Completo
          </DropdownMenuItem>
          <DropdownMenuItem className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">
            <Settings className="mr-2 h-4 w-4" />
            Configuración
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-[var(--border-primary)]" />
          <DropdownMenuItem 
            onClick={() => base44.auth.logout()}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>

      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-primary)] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)] text-xl">Mi Perfil</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Header con avatar */}
            <div className="flex items-center gap-6 p-6 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-primary)]">
              <Avatar className="h-20 w-20 bg-[#FF1B7E]">
                <AvatarFallback className="bg-[#FF1B7E] text-white text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">{user.full_name || user.email}</h2>
                <p className="text-[var(--text-secondary)]">{user.email}</p>
                {teamMember && (
                  <Badge className={`mt-2 ${roleConfig.color} text-white`}>
                    {roleConfig.name || teamMember.role}
                  </Badge>
                )}
              </div>
            </div>

            {/* Información del rol */}
            {teamMember && (
              <Card className="p-6 bg-[var(--bg-tertiary)] border-[var(--border-primary)]">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-[#FF1B7E]" />
                  Información del Cargo
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-[var(--text-secondary)]">Rol:</span>
                    <span className="text-[var(--text-primary)] ml-2 font-medium">{roleConfig.name || teamMember.role}</span>
                  </div>
                  {leader && (
                    <div>
                      <span className="text-[var(--text-secondary)]">Líder de Área:</span>
                      <span className="text-[var(--text-primary)] ml-2 font-medium">
                        {leader.display_name || leader.user_email}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-[var(--text-secondary)]">Área que domina:</span>
                    <span className="text-[var(--text-primary)] ml-2 font-medium">
                      {roleConfig.name?.replace('Líder de ', '') || teamMember.role}
                    </span>
                  </div>
                  {roleConfig.canComplete && (
                    <div>
                      <span className="text-[var(--text-secondary)]">Fases que puede completar:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {roleConfig.canComplete.map(phase => (
                          <Badge key={phase} variant="outline" className="text-xs border-[var(--border-secondary)] text-[var(--text-secondary)]">
                            {phase === 'all' ? 'Todas' : phase}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Proyectos asignados */}
            <Card className="p-6 bg-[var(--bg-tertiary)] border-[var(--border-primary)]">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-[#FF1B7E]" />
                Proyectos Asignados ({projects.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {projects.length === 0 ? (
                  <p className="text-[var(--text-secondary)] text-sm">No tienes proyectos asignados</p>
                ) : (
                  projects.map(project => (
                    <div key={project.id} className="flex items-center justify-between p-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-primary)]">
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{project.name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{project.status}</p>
                      </div>
                      <Badge variant="outline" className="border-[#FF1B7E] text-[#FF1B7E]">
                        {project.completion_percentage?.toFixed(0) || 0}%
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}