import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, Copy, Check, ExternalLink, Search, Filter, Star, Clock, Package } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function GlobalAccess() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [filterEnvironment, setFilterEnvironment] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showPasswords, setShowPasswords] = useState({});
  const [copiedField, setCopiedField] = useState(null);

  // Fetch todos los proyectos
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  // Fetch todos los accesos
  const { data: allAccess = [], isLoading: accessLoading } = useQuery({
    queryKey: ['all-project-access'],
    queryFn: () => base44.entities.ProjectAccess.list(),
  });

  // Combinar datos de proyectos con accesos
  const accessWithProjects = useMemo(() => {
    return allAccess.map(access => {
      const project = projects.find(p => p.id === access.project_id);
      return { ...access, project };
    }).filter(a => a.project); // Solo mostrar accesos con proyecto válido
  }, [allAccess, projects]);

  // Filtrar accesos
  const filteredAccess = useMemo(() => {
    let filtered = accessWithProjects;

    // Filtro por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(access => 
        access.project?.name?.toLowerCase().includes(term) ||
        access.qa_hosting_url?.toLowerCase().includes(term) ||
        access.prod_hosting_url?.toLowerCase().includes(term) ||
        access.cms_qa_url?.toLowerCase().includes(term) ||
        access.cms_prod_url?.toLowerCase().includes(term) ||
        access.apis?.some(api => api.name?.toLowerCase().includes(term))
      );
    }

    // Filtro por proyecto
    if (filterProject !== 'all') {
      filtered = filtered.filter(access => access.project_id === filterProject);
    }

    return filtered;
  }, [accessWithProjects, searchTerm, filterProject]);

  // Extraer todos los accesos individuales para filtrado
  const flattenedAccess = useMemo(() => {
    const items = [];
    
    filteredAccess.forEach(access => {
      // Hosting QA
      if (access.qa_hosting_url) {
        items.push({
          id: `${access.id}-qa-hosting`,
          projectId: access.project_id,
          projectName: access.project?.name,
          type: 'hosting',
          environment: 'qa',
          name: 'Hosting QA',
          url: access.qa_hosting_url,
          user: access.qa_hosting_user,
          password: access.qa_hosting_password,
        });
      }
      
      // Hosting Producción
      if (access.prod_hosting_url) {
        items.push({
          id: `${access.id}-prod-hosting`,
          projectId: access.project_id,
          projectName: access.project?.name,
          type: 'hosting',
          environment: 'prod',
          name: 'Hosting Producción',
          url: access.prod_hosting_url,
          user: access.prod_hosting_user,
          password: access.prod_hosting_password,
        });
      }
      
      // CMS QA
      if (access.cms_qa_url) {
        items.push({
          id: `${access.id}-cms-qa`,
          projectId: access.project_id,
          projectName: access.project?.name,
          type: 'cms',
          environment: 'qa',
          name: 'CMS QA',
          url: access.cms_qa_url,
          user: access.cms_qa_user,
          password: access.cms_qa_password,
        });
      }
      
      // CMS Producción
      if (access.cms_prod_url) {
        items.push({
          id: `${access.id}-cms-prod`,
          projectId: access.project_id,
          projectName: access.project?.name,
          type: 'cms',
          environment: 'prod',
          name: 'CMS Producción',
          url: access.cms_prod_url,
          user: access.cms_prod_user,
          password: access.cms_prod_password,
        });
      }
      
      // APIs
      if (access.apis && access.apis.length > 0) {
        access.apis.forEach((api, index) => {
          if (api.url) {
            items.push({
              id: `${access.id}-api-${index}`,
              projectId: access.project_id,
              projectName: access.project?.name,
              type: 'api',
              environment: 'api',
              name: api.name || `API ${index + 1}`,
              url: api.url,
              user: api.user,
              password: api.password,
            });
          }
        });
      }
    });
    
    return items;
  }, [filteredAccess]);

  // Aplicar filtros adicionales
  const finalFilteredAccess = useMemo(() => {
    let filtered = flattenedAccess;

    // Filtro por ambiente
    if (filterEnvironment !== 'all') {
      filtered = filtered.filter(item => item.environment === filterEnvironment);
    }

    // Filtro por tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType);
    }

    return filtered;
  }, [flattenedAccess, filterEnvironment, filterType]);

  // Agrupar por proyecto
  const groupedByProject = useMemo(() => {
    const groups = {};
    finalFilteredAccess.forEach(item => {
      if (!groups[item.projectId]) {
        groups[item.projectId] = {
          projectName: item.projectName,
          items: []
        };
      }
      groups[item.projectId].items.push(item);
    });
    return Object.entries(groups);
  }, [finalFilteredAccess]);

  const togglePasswordVisibility = (field) => {
    setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] });
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copiado al portapapeles');
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (projectsLoading || accessLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF1B7E] mx-auto mb-4" />
          <p className="text-sm text-[var(--text-secondary)]">Cargando accesos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
            Accesos Globales
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Consulta todos los accesos técnicos de todos los proyectos en un solo lugar
          </p>
        </div>

        {/* Filtros y búsqueda */}
        <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Búsqueda */}
              <div className="md:col-span-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
                  <Input
                    placeholder="Buscar por proyecto, URL o nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-[var(--bg-input)]"
                  />
                </div>
              </div>

              {/* Filtro por proyecto */}
              <div>
                <Label className="text-xs mb-2 block">Proyecto</Label>
                <Select value={filterProject} onValueChange={setFilterProject}>
                  <SelectTrigger className="bg-[var(--bg-input)]">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los proyectos</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por ambiente */}
              <div>
                <Label className="text-xs mb-2 block">Ambiente</Label>
                <Select value={filterEnvironment} onValueChange={setFilterEnvironment}>
                  <SelectTrigger className="bg-[var(--bg-input)]">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="qa">QA</SelectItem>
                    <SelectItem value="prod">Producción</SelectItem>
                    <SelectItem value="api">APIs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por tipo */}
              <div>
                <Label className="text-xs mb-2 block">Tipo</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="bg-[var(--bg-input)]">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="hosting">Hosting</SelectItem>
                    <SelectItem value="cms">CMS</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Botón limpiar filtros */}
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterProject('all');
                    setFilterEnvironment('all');
                    setFilterType('all');
                  }}
                  className="w-full"
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="mt-4 pt-4 border-t border-[var(--border-primary)] flex gap-4">
              <div className="text-sm">
                <span className="text-[var(--text-tertiary)]">Total de accesos:</span>
                <span className="ml-2 font-semibold text-[var(--text-primary)]">
                  {finalFilteredAccess.length}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-[var(--text-tertiary)]">Proyectos:</span>
                <span className="ml-2 font-semibold text-[var(--text-primary)]">
                  {groupedByProject.length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accesos agrupados por proyecto */}
        {groupedByProject.length === 0 ? (
          <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 text-[var(--text-tertiary)] mx-auto mb-4" />
              <p className="text-sm text-[var(--text-secondary)]">
                No se encontraron accesos con los filtros aplicados
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {groupedByProject.map(([projectId, group]) => (
              <Card key={projectId} className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {group.projectName}
                      <Badge variant="outline" className="text-xs">
                        {group.items.length} {group.items.length === 1 ? 'acceso' : 'accesos'}
                      </Badge>
                    </CardTitle>
                    <Link to={`${createPageUrl('ProjectChecklist')}?id=${projectId}`}>
                      <Button variant="outline" size="sm">
                        Ver proyecto
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {group.items.map(item => (
                    <div
                      key={item.id}
                      className="p-4 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm text-[var(--text-primary)]">
                            {item.name}
                          </h4>
                          <Badge className={
                            item.environment === 'qa' ? 'bg-blue-500' :
                            item.environment === 'prod' ? 'bg-green-500' :
                            'bg-purple-500'
                          }>
                            {item.environment === 'qa' ? 'QA' :
                             item.environment === 'prod' ? 'PROD' :
                             'API'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {item.type}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {/* URL */}
                        {item.url && (
                          <div>
                            <Label className="text-xs text-[var(--text-tertiary)]">URL</Label>
                            <div className="flex gap-2 mt-1">
                              <Input
                                value={item.url}
                                readOnly
                                className="bg-[var(--bg-input)] text-xs"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => window.open(item.url, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Usuario */}
                        {item.user && (
                          <div>
                            <Label className="text-xs text-[var(--text-tertiary)]">Usuario</Label>
                            <div className="relative mt-1">
                              <Input
                                value={item.user}
                                readOnly
                                className="bg-[var(--bg-input)] pr-10 text-xs"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                onClick={() => copyToClipboard(item.user, `${item.id}-user`)}
                              >
                                {copiedField === `${item.id}-user` ?
                                  <Check className="h-4 w-4 text-green-500" /> :
                                  <Copy className="h-4 w-4" />
                                }
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Contraseña */}
                        {item.password && (
                          <div>
                            <Label className="text-xs text-[var(--text-tertiary)]">Contraseña</Label>
                            <div className="relative mt-1">
                              <Input
                                value={item.password}
                                type={showPasswords[item.id] ? 'text' : 'password'}
                                readOnly
                                className="bg-[var(--bg-input)] pr-20 text-xs"
                              />
                              <div className="absolute top-1/2 -translate-y-1/2 right-1 flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => togglePasswordVisibility(item.id)}
                                >
                                  {showPasswords[item.id] ?
                                    <EyeOff className="h-4 w-4" /> :
                                    <Eye className="h-4 w-4" />
                                  }
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => copyToClipboard(item.password, `${item.id}-pass`)}
                                >
                                  {copiedField === `${item.id}-pass` ?
                                    <Check className="h-4 w-4 text-green-500" /> :
                                    <Copy className="h-4 w-4" />
                                  }
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}