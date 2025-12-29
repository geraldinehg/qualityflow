import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Users, Briefcase, TrendingUp, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const AREA_LABELS = {
  ux: 'UX',
  ui: 'UI',
  seo: 'SEO',
  paid: 'Paid Media',
  software: 'Software/Desarrollo',
  web_dev: 'Desarrollo web',
  marketing: 'Marketing',
  social: 'Social Media'
};

export default function ResourceOccupancy() {
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date')
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => base44.entities.TeamMember.filter({ is_active: true })
  });

  // Filtrar solo proyectos activos
  const activeProjects = projects.filter(p => 
    p.status === 'in_progress' || p.status === 'review'
  );

  // Calcular ocupación por área
  const areaOccupancy = useMemo(() => {
    const occupancy = {};
    
    activeProjects.forEach(project => {
      const areas = project.applicable_areas || [];
      areas.forEach(area => {
        if (!occupancy[area]) {
          occupancy[area] = {
            area,
            label: AREA_LABELS[area] || area,
            projects: [],
            totalValue: 0,
            responsibles: new Set()
          };
        }
        
        occupancy[area].projects.push(project);
        occupancy[area].totalValue += parseFloat(project.project_value) || 0;
        
        if (project.area_responsibles && project.area_responsibles[area]) {
          occupancy[area].responsibles.add(project.area_responsibles[area]);
        }
      });
    });

    return Object.values(occupancy).map(data => ({
      ...data,
      responsibles: Array.from(data.responsibles)
    }));
  }, [activeProjects]);

  // Calcular ocupación por responsable
  const responsibleOccupancy = useMemo(() => {
    const occupancy = {};

    activeProjects.forEach(project => {
      const responsibles = project.area_responsibles || {};
      
      Object.entries(responsibles).forEach(([area, email]) => {
        if (!occupancy[email]) {
          const member = teamMembers.find(m => m.user_email === email);
          occupancy[email] = {
            email,
            name: member?.display_name || email,
            role: member?.role,
            projects: [],
            areas: new Set(),
            totalValue: 0
          };
        }
        
        occupancy[email].projects.push({
          ...project,
          assignedArea: area
        });
        occupancy[email].areas.add(area);
        occupancy[email].totalValue += parseFloat(project.project_value) || 0;
      });
    });

    return Object.values(occupancy).map(data => ({
      ...data,
      areas: Array.from(data.areas)
    })).sort((a, b) => b.projects.length - a.projects.length);
  }, [activeProjects, teamMembers]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="by-area" className="w-full">
        <TabsList className="bg-[#0a0a0a] border-[#2a2a2a] mb-6">
          <TabsTrigger 
            value="by-area" 
            className="data-[state=active]:bg-[#FF1B7E] data-[state=active]:text-white"
          >
            <Briefcase className="h-4 w-4 mr-2" />
            Por Área
          </TabsTrigger>
          <TabsTrigger 
            value="by-responsible" 
            className="data-[state=active]:bg-[#FF1B7E] data-[state=active]:text-white"
          >
            <Users className="h-4 w-4 mr-2" />
            Por Responsable
          </TabsTrigger>
        </TabsList>

        {/* Vista por Área */}
        <TabsContent value="by-area" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {areaOccupancy.map((data) => (
              <Card key={data.area} className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between text-white">
                    <span>{data.label}</span>
                    <Badge className="bg-[#FF1B7E]/20 text-[#FF1B7E] border-[#FF1B7E]/40">
                      {data.projects.length} proyectos
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Responsables */}
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Responsables</p>
                    {data.responsibles.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {data.responsibles.map(email => {
                          const member = teamMembers.find(m => m.user_email === email);
                          return (
                            <Badge key={email} variant="outline" className="text-xs border-gray-600 text-gray-300">
                              {member?.display_name || email}
                            </Badge>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">Sin responsables asignados</p>
                    )}
                  </div>

                  {/* Valor total */}
                  {data.totalValue > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Valor total</p>
                      <p className="text-lg font-bold text-[#FF1B7E]">
                        ${data.totalValue.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* Lista de proyectos */}
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Proyectos activos</p>
                    <div className="space-y-2">
                      {data.projects.map(project => (
                        <Link key={project.id} to={`${createPageUrl('ProjectChecklist')}?id=${project.id}`}>
                          <div className="p-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded hover:border-[#FF1B7E]/40 transition-all cursor-pointer">
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-white font-medium truncate">
                                {project.name}
                              </p>
                              <Progress 
                                value={project.completion_percentage || 0} 
                                className="w-16 h-1.5 bg-white/20 [&>div]:bg-[#FF1B7E]"
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {Math.round(project.completion_percentage || 0)}% completado
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {areaOccupancy.length === 0 && (
            <div className="text-center py-20">
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Briefcase className="h-10 w-10 text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Sin ocupación por área</h3>
              <p className="text-gray-400">No hay proyectos activos con áreas asignadas</p>
            </div>
          )}
        </TabsContent>

        {/* Vista por Responsable */}
        <TabsContent value="by-responsible" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {responsibleOccupancy.map((data) => (
              <Card key={data.email} className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardHeader>
                  <CardTitle className="text-base text-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{data.name}</p>
                        <p className="text-xs text-gray-400 font-normal">{data.email}</p>
                      </div>
                      <Badge className="bg-[#FF1B7E]/20 text-[#FF1B7E] border-[#FF1B7E]/40">
                        {data.projects.length}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Áreas */}
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Áreas asignadas</p>
                    <div className="flex flex-wrap gap-2">
                      {data.areas.map(area => (
                        <Badge key={area} variant="outline" className="text-xs border-gray-600 text-gray-300">
                          {AREA_LABELS[area] || area}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Valor total */}
                  {data.totalValue > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Valor total de proyectos</p>
                      <p className="text-lg font-bold text-[#FF1B7E]">
                        ${data.totalValue.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* Proyectos asignados */}
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Proyectos asignados</p>
                    <div className="space-y-2">
                      {data.projects.map(project => (
                        <Link key={project.id} to={`${createPageUrl('ProjectChecklist')}?id=${project.id}`}>
                          <div className="p-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded hover:border-[#FF1B7E]/40 transition-all cursor-pointer">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm text-white font-medium truncate">
                                {project.name}
                              </p>
                              <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                                {AREA_LABELS[project.assignedArea] || project.assignedArea}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-gray-500">
                                {Math.round(project.completion_percentage || 0)}% completado
                              </p>
                              <Progress 
                                value={project.completion_percentage || 0} 
                                className="w-16 h-1.5 bg-white/20 [&>div]:bg-[#FF1B7E]"
                              />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {responsibleOccupancy.length === 0 && (
            <div className="text-center py-20">
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Users className="h-10 w-10 text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Sin responsables asignados</h3>
              <p className="text-gray-400">No hay responsables asignados en proyectos activos</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}