import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Share2, Eye, EyeOff, Copy, Check, ExternalLink, Clock, User } from 'lucide-react';
import { toast } from 'sonner';

export default function SharedAccessesView() {
  const [user, setUser] = useState(null);
  const [showPasswords, setShowPasswords] = useState({});
  const [copiedField, setCopiedField] = useState(null);
  const [selectedAccess, setSelectedAccess] = useState(null);
  const [accessData, setAccessData] = useState(null);

  React.useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);

  // Solo usuarios @antpack.co pueden ver esta vista
  const isAntpackUser = user?.email?.endsWith('@antpack.co');

  const { data: sharedWithMe = [] } = useQuery({
    queryKey: ['shared-with-me', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const result = await base44.entities.SharedProjectAccess.filter({ 
        shared_with_email: user.email,
        is_active: true
      });
      return result.filter(access => {
        if (!access.expires_at) return true;
        return new Date(access.expires_at) > new Date();
      });
    },
    enabled: !!user?.email
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects-for-shared'],
    queryFn: () => base44.entities.Project.list(),
    enabled: sharedWithMe.length > 0
  });

  const loadAccessData = async (sharedAccess) => {
    try {
      const response = await base44.functions.invoke('getSharedAccess', {
        projectId: sharedAccess.project_id
      });

      if (response.data.success) {
        setAccessData(response.data.data);
        setSelectedAccess(sharedAccess);
      }
    } catch (error) {
      toast.error('Error al cargar los accesos');
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] });
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copiado al portapapeles');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Proyecto';
  };

  if (!user) return null;

  if (!isAntpackUser) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
          <CardContent className="py-12 text-center">
            <Share2 className="h-12 w-12 text-[var(--text-tertiary)] mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Acceso No Disponible
            </h2>
            <p className="text-[var(--text-secondary)]">
              Esta sección solo está disponible para usuarios de @antpack.co
            </p>
            <p className="text-sm text-[var(--text-secondary)] mt-2">
              Los accesos compartidos contigo fueron enviados por email en formato PDF
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Share2 className="h-6 w-6 text-[#FF1B7E]" />
          Accesos Compartidos Conmigo
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Proyectos y accesos que otros usuarios han compartido contigo
        </p>
      </div>

      {sharedWithMe.length === 0 ? (
        <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
          <CardContent className="py-12 text-center">
            <Share2 className="h-12 w-12 text-[var(--text-tertiary)] mx-auto mb-4" />
            <p className="text-[var(--text-secondary)]">No tienes accesos compartidos</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Lista de accesos compartidos */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Proyectos ({sharedWithMe.length})
            </h2>
            {sharedWithMe.map((access) => (
              <Card 
                key={access.id} 
                className={`bg-[var(--bg-secondary)] border-[var(--border-primary)] cursor-pointer transition-all hover:border-[#FF1B7E] ${selectedAccess?.id === access.id ? 'border-[#FF1B7E]' : ''}`}
                onClick={() => loadAccessData(access)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-[var(--text-primary)]">
                        {getProjectName(access.project_id)}
                      </h3>
                      <div className="flex items-center gap-2 mt-2 text-xs text-[var(--text-secondary)]">
                        <User className="h-3 w-3" />
                        <span>Compartido por {access.shared_by}</span>
                      </div>
                      {access.expires_at && (
                        <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-secondary)]">
                          <Clock className="h-3 w-3" />
                          <span>Expira: {new Date(access.expires_at).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {access.permissions.qa_hosting && <Badge variant="outline" className="text-xs">QA Hosting</Badge>}
                        {access.permissions.prod_hosting && <Badge variant="outline" className="text-xs">Prod Hosting</Badge>}
                        {access.permissions.cms_qa && <Badge variant="outline" className="text-xs">CMS QA</Badge>}
                        {access.permissions.cms_prod && <Badge variant="outline" className="text-xs">CMS Prod</Badge>}
                        {access.permissions.apis?.length > 0 && <Badge variant="outline" className="text-xs">{access.permissions.apis.length} APIs</Badge>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detalles del acceso seleccionado */}
          <div className="space-y-4">
            {selectedAccess && accessData ? (
              <>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Detalles de Acceso
                </h2>

                {accessData.qa_hosting && (
                  <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Badge className="bg-blue-500">QA</Badge>
                        Hosting de QA
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {accessData.qa_hosting.url && (
                        <div>
                          <label className="text-xs text-[var(--text-secondary)]">URL</label>
                          <div className="flex gap-2">
                            <Input value={accessData.qa_hosting.url} readOnly className="text-sm" />
                            <Button variant="outline" size="icon" onClick={() => window.open(accessData.qa_hosting.url, '_blank')}>
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                      {accessData.qa_hosting.user && (
                        <div>
                          <label className="text-xs text-[var(--text-secondary)]">Usuario</label>
                          <div className="relative">
                            <Input value={accessData.qa_hosting.user} readOnly className="text-sm pr-10" />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                              onClick={() => copyToClipboard(accessData.qa_hosting.user, 'qa_user')}
                            >
                              {copiedField === 'qa_user' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      )}
                      {accessData.qa_hosting.password && (
                        <div>
                          <label className="text-xs text-[var(--text-secondary)]">Contraseña</label>
                          <div className="relative">
                            <Input 
                              value={accessData.qa_hosting.password} 
                              type={showPasswords['qa_pass'] ? 'text' : 'password'}
                              readOnly 
                              className="text-sm pr-20" 
                            />
                            <div className="absolute top-1/2 -translate-y-1/2 right-1 flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => togglePasswordVisibility('qa_pass')}
                              >
                                {showPasswords['qa_pass'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => copyToClipboard(accessData.qa_hosting.password, 'qa_pass')}
                              >
                                {copiedField === 'qa_pass' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Repetir estructura similar para prod_hosting, cms_qa, cms_prod, apis */}
                
              </>
            ) : (
              <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
                <CardContent className="py-12 text-center">
                  <p className="text-[var(--text-secondary)]">
                    Selecciona un proyecto para ver sus accesos
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}