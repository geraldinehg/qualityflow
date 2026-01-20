import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ExternalLink, Eye, EyeOff, Copy, Check, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function GlobalAccess() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showPasswords, setShowPasswords] = useState({});
  const [copiedField, setCopiedField] = useState(null);

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const { data: allAccesses = [], isLoading: accessesLoading } = useQuery({
    queryKey: ['all-project-accesses'],
    queryFn: () => base44.entities.ProjectAccess.list(),
  });

  const togglePasswordVisibility = (field) => {
    setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] });
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copiado al portapapeles');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const projectsWithAccess = filteredProjects.map(project => {
    const access = allAccesses.find(a => a.project_id === project.id);
    return { project, access };
  }).filter(item => item.access);

  if (projectsLoading || accessesLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF1B7E] mx-auto" />
        <p className="text-sm text-[var(--text-secondary)] mt-4">Cargando accesos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Accesos Globales</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Consulta los accesos de hosting, CMS y APIs de todos los proyectos
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {projectsWithAccess.length} proyectos con accesos
        </Badge>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
        <Input
          placeholder="Buscar proyecto por nombre..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-[var(--bg-secondary)] border-[var(--border-primary)]"
        />
      </div>

      {/* Lista de proyectos con accesos */}
      {projectsWithAccess.length === 0 ? (
        <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
          <CardContent className="py-12 text-center">
            <Lock className="h-12 w-12 text-[var(--text-tertiary)] mx-auto mb-3" />
            <p className="text-[var(--text-secondary)]">
              {searchQuery ? 'No se encontraron proyectos con ese nombre' : 'No hay proyectos con accesos configurados'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {projectsWithAccess.map(({ project, access }) => (
            <Card key={project.id} className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
              <CardHeader>
                <CardTitle className="text-xl text-[var(--text-primary)]">{project.name}</CardTitle>
                <p className="text-sm text-[var(--text-secondary)]">{project.description}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Hosting QA */}
                {(access.qa_hosting_url || access.qa_hosting_access) && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-500">QA</Badge>
                      <h4 className="text-sm font-semibold text-[var(--text-primary)]">Hosting QA</h4>
                    </div>
                    {access.qa_hosting_url && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--text-secondary)] w-16">URL:</span>
                        <a 
                          href={access.qa_hosting_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-[#FF1B7E] hover:underline flex items-center gap-1"
                        >
                          {access.qa_hosting_url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    {access.qa_hosting_access && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--text-secondary)] w-16">Acceso:</span>
                        <div className="flex-1 flex items-center gap-2">
                          <code className="text-xs bg-[var(--bg-tertiary)] px-2 py-1 rounded flex-1 font-mono">
                            {showPasswords[`qa_host_${project.id}`] ? access.qa_hosting_access : '••••••••••'}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => togglePasswordVisibility(`qa_host_${project.id}`)}
                          >
                            {showPasswords[`qa_host_${project.id}`] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => copyToClipboard(access.qa_hosting_access, `qa_host_${project.id}`)}
                          >
                            {copiedField === `qa_host_${project.id}` ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Hosting Producción */}
                {(access.prod_hosting_url || access.prod_hosting_access) && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500">PROD</Badge>
                      <h4 className="text-sm font-semibold text-[var(--text-primary)]">Hosting Producción</h4>
                    </div>
                    {access.prod_hosting_url && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--text-secondary)] w-16">URL:</span>
                        <a 
                          href={access.prod_hosting_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-[#FF1B7E] hover:underline flex items-center gap-1"
                        >
                          {access.prod_hosting_url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    {access.prod_hosting_access && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--text-secondary)] w-16">Acceso:</span>
                        <div className="flex-1 flex items-center gap-2">
                          <code className="text-xs bg-[var(--bg-tertiary)] px-2 py-1 rounded flex-1 font-mono">
                            {showPasswords[`prod_host_${project.id}`] ? access.prod_hosting_access : '••••••••••'}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => togglePasswordVisibility(`prod_host_${project.id}`)}
                          >
                            {showPasswords[`prod_host_${project.id}`] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => copyToClipboard(access.prod_hosting_access, `prod_host_${project.id}`)}
                          >
                            {copiedField === `prod_host_${project.id}` ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* CMS QA */}
                {(access.cms_qa_url || access.cms_qa_access) && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-500">QA</Badge>
                      <h4 className="text-sm font-semibold text-[var(--text-primary)]">CMS QA</h4>
                    </div>
                    {access.cms_qa_url && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--text-secondary)] w-16">URL:</span>
                        <a 
                          href={access.cms_qa_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-[#FF1B7E] hover:underline flex items-center gap-1"
                        >
                          {access.cms_qa_url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    {access.cms_qa_access && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--text-secondary)] w-16">Acceso:</span>
                        <div className="flex-1 flex items-center gap-2">
                          <code className="text-xs bg-[var(--bg-tertiary)] px-2 py-1 rounded flex-1 font-mono">
                            {showPasswords[`cms_qa_${project.id}`] ? access.cms_qa_access : '••••••••••'}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => togglePasswordVisibility(`cms_qa_${project.id}`)}
                          >
                            {showPasswords[`cms_qa_${project.id}`] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => copyToClipboard(access.cms_qa_access, `cms_qa_${project.id}`)}
                          >
                            {copiedField === `cms_qa_${project.id}` ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* CMS Producción */}
                {(access.cms_prod_url || access.cms_prod_access) && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500">PROD</Badge>
                      <h4 className="text-sm font-semibold text-[var(--text-primary)]">CMS Producción</h4>
                    </div>
                    {access.cms_prod_url && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--text-secondary)] w-16">URL:</span>
                        <a 
                          href={access.cms_prod_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-[#FF1B7E] hover:underline flex items-center gap-1"
                        >
                          {access.cms_prod_url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    {access.cms_prod_access && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--text-secondary)] w-16">Acceso:</span>
                        <div className="flex-1 flex items-center gap-2">
                          <code className="text-xs bg-[var(--bg-tertiary)] px-2 py-1 rounded flex-1 font-mono">
                            {showPasswords[`cms_prod_${project.id}`] ? access.cms_prod_access : '••••••••••'}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => togglePasswordVisibility(`cms_prod_${project.id}`)}
                          >
                            {showPasswords[`cms_prod_${project.id}`] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => copyToClipboard(access.cms_prod_access, `cms_prod_${project.id}`)}
                          >
                            {copiedField === `cms_prod_${project.id}` ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* APIs */}
                {access.apis && access.apis.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">APIs</h4>
                    {access.apis.map((api, idx) => (
                      <div key={idx} className="bg-[var(--bg-tertiary)] rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-[var(--text-primary)]">{api.name}</span>
                          {api.url && (
                            <a 
                              href={api.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[#FF1B7E] hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        {api.url && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[var(--text-secondary)] w-16">URL:</span>
                            <code className="text-xs bg-[var(--bg-input)] px-2 py-1 rounded flex-1 font-mono text-[var(--text-primary)]">
                              {api.url}
                            </code>
                          </div>
                        )}
                        {api.access && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[var(--text-secondary)] w-16">Acceso:</span>
                            <div className="flex-1 flex items-center gap-2">
                              <code className="text-xs bg-[var(--bg-input)] px-2 py-1 rounded flex-1 font-mono">
                                {showPasswords[`api_${project.id}_${idx}`] ? api.access : '••••••••••'}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => togglePasswordVisibility(`api_${project.id}_${idx}`)}
                              >
                                {showPasswords[`api_${project.id}_${idx}`] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => copyToClipboard(api.access, `api_${project.id}_${idx}`)}
                              >
                                {copiedField === `api_${project.id}_${idx}` ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}