import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, TrendingUp, CheckCircle2, Clock, AlertCircle, Pencil } from 'lucide-react';
import { ROLE_CONFIG } from '../components/checklist/checklistTemplates';

export default function Statistics() {
  const [editingStatsRole, setEditingStatsRole] = useState(null);
  const queryClient = useQueryClient();

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => base44.entities.TeamMember.list('-created_date')
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date')
  });

  const { data: checklistItems = [] } = useQuery({
    queryKey: ['all-checklist-items'],
    queryFn: () => base44.entities.ChecklistItem.list('-created_date')
  });

  const activeMembers = teamMembers.filter(m => m.is_active);

  const updateMemberMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TeamMember.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      setEditingStatsRole(null);
    }
  });

  const handleUpdateMember = (member, updates) => {
    updateMemberMutation.mutate({ id: member.id, data: updates });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Estadísticas de Rendimiento</h1>
        <Badge variant="outline" className="border-[var(--border-secondary)] text-[var(--text-secondary)]">
          {activeMembers.length} miembros activos
        </Badge>
      </div>

      {activeMembers.length === 0 ? (
        <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-[var(--text-tertiary)] mx-auto mb-4" />
            <p className="text-[var(--text-secondary)]">No hay miembros del equipo registrados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activeMembers.map((member) => {
            const memberProjects = projects.filter(p => {
              const phaseResponsibles = p.phase_responsibles || {};
              return Object.values(phaseResponsibles).some(emails => 
                Array.isArray(emails) ? emails.includes(member.user_email) : emails === member.user_email
              ) || (p.area_responsibles && Object.values(p.area_responsibles).includes(member.user_email));
            });
            
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
              <Card key={member.id} className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
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
                              className="h-8"
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
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">Progreso general</span>
                      <span className="text-[var(--text-primary)] font-medium">
                        {completedItems.length} / {memberItems.length} ítems
                      </span>
                    </div>
                    <Progress value={completionRate} className="h-2 bg-[var(--bg-tertiary)] [&>div]:bg-[#FF1B7E]" />
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-[var(--bg-tertiary)] rounded-lg p-3 border border-[var(--border-secondary)]">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-4 w-4 text-blue-400" />
                        <p className="text-xs text-[var(--text-secondary)]">Proyectos</p>
                      </div>
                      <p className="text-2xl font-bold text-[var(--text-primary)]">{memberProjects.length}</p>
                    </div>
                    
                    <div className="bg-[var(--bg-tertiary)] rounded-lg p-3 border border-[var(--border-secondary)]">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                        <p className="text-xs text-[var(--text-secondary)]">Completados</p>
                      </div>
                      <p className="text-2xl font-bold text-green-400">{completedItems.length}</p>
                    </div>
                    
                    <div className="bg-[var(--bg-tertiary)] rounded-lg p-3 border border-[var(--border-secondary)]">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-yellow-400" />
                        <p className="text-xs text-[var(--text-secondary)]">Pendientes</p>
                      </div>
                      <p className="text-2xl font-bold text-yellow-400">{pendingItems.length}</p>
                    </div>
                    
                    <div className="bg-[var(--bg-tertiary)] rounded-lg p-3 border border-[var(--border-secondary)]">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <p className="text-xs text-[var(--text-secondary)]">Críticos</p>
                      </div>
                      <p className="text-2xl font-bold text-red-400">{criticalPending.length}</p>
                    </div>
                  </div>
                  
                  {memberProjects.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-[var(--text-secondary)]">Proyectos asignados:</p>
                      <div className="space-y-1">
                        {memberProjects.map(project => (
                          <div key={project.id} className="flex items-center justify-between p-2 bg-[var(--bg-tertiary)] rounded border border-[var(--border-secondary)]">
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
        </div>
      )}
    </div>
  );
}