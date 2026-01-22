import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, ExternalLink, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function ProjectAccessTab({ projectId }) {
  const [showPasswords, setShowPasswords] = useState({});
  const [copiedField, setCopiedField] = useState(null);
  const queryClient = useQueryClient();

  const { data: accessData, isLoading } = useQuery({
    queryKey: ['project-access', projectId],
    queryFn: async () => {
      const result = await base44.entities.ProjectAccess.filter({ project_id: projectId });
      return result[0] || null;
    },
    enabled: !!projectId
  });

  const [formData, setFormData] = useState({
    qa_hosting_url: '',
    qa_hosting_user: '',
    qa_hosting_password: '',
    prod_hosting_url: '',
    prod_hosting_user: '',
    prod_hosting_password: '',
    cms_qa_url: '',
    cms_qa_user: '',
    cms_qa_password: '',
    cms_prod_url: '',
    cms_prod_user: '',
    cms_prod_password: '',
    apis: []
  });

  React.useEffect(() => {
    if (accessData) {
      setFormData({
        qa_hosting_url: accessData.qa_hosting_url || '',
        qa_hosting_user: accessData.qa_hosting_user || '',
        qa_hosting_password: accessData.qa_hosting_password || '',
        prod_hosting_url: accessData.prod_hosting_url || '',
        prod_hosting_user: accessData.prod_hosting_user || '',
        prod_hosting_password: accessData.prod_hosting_password || '',
        cms_qa_url: accessData.cms_qa_url || '',
        cms_qa_user: accessData.cms_qa_user || '',
        cms_qa_password: accessData.cms_qa_password || '',
        cms_prod_url: accessData.cms_prod_url || '',
        cms_prod_user: accessData.cms_prod_user || '',
        cms_prod_password: accessData.cms_prod_password || '',
        apis: accessData.apis || []
      });
    }
  }, [accessData]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (accessData?.id) {
        return await base44.entities.ProjectAccess.update(accessData.id, data);
      } else {
        return await base44.entities.ProjectAccess.create({ ...data, project_id: projectId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-access', projectId] });
      toast.success('Accesos guardados correctamente');
    },
    onError: (error) => {
      toast.error(`Error al guardar: ${error.message}`);
    }
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const handleAddApi = () => {
    setFormData({
      ...formData,
      apis: [...formData.apis, { name: '', url: '', user: '', password: '' }]
    });
  };

  const handleRemoveApi = (index) => {
    const newApis = formData.apis.filter((_, i) => i !== index);
    setFormData({ ...formData, apis: newApis });
  };

  const handleApiChange = (index, field, value) => {
    const newApis = [...formData.apis];
    newApis[index][field] = value;
    setFormData({ ...formData, apis: newApis });
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
      {/* Hosting QA */}
      <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-[var(--text-primary)]">
            <Badge className="bg-blue-500">QA</Badge>
            Hosting de QA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">URL</Label>
            <div className="flex gap-2">
              <Input
                value={formData.qa_hosting_url}
                onChange={(e) => setFormData({ ...formData, qa_hosting_url: e.target.value })}
                placeholder="https://qa.ejemplo.com"
                className="bg-[var(--bg-input)]"
              />
              {formData.qa_hosting_url && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(formData.qa_hosting_url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div>
            <Label className="text-xs">Usuario</Label>
            <div className="relative">
              <Input
                value={formData.qa_hosting_user}
                onChange={(e) => setFormData({ ...formData, qa_hosting_user: e.target.value })}
                placeholder="usuario@ejemplo.com"
                className="bg-[var(--bg-input)] pr-10"
              />
              {formData.qa_hosting_user && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => copyToClipboard(formData.qa_hosting_user, 'qa_hosting_user')}
                >
                  {copiedField === 'qa_hosting_user' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </div>
          <div>
            <Label className="text-xs">Contraseña</Label>
            <div className="relative">
              <Input
                value={formData.qa_hosting_password}
                onChange={(e) => setFormData({ ...formData, qa_hosting_password: e.target.value })}
                placeholder="••••••••"
                type={showPasswords['qa_hosting'] ? 'text' : 'password'}
                className="bg-[var(--bg-input)] pr-20"
              />
              <div className="absolute top-1/2 -translate-y-1/2 right-1 flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => togglePasswordVisibility('qa_hosting')}
                >
                  {showPasswords['qa_hosting'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                {formData.qa_hosting_password && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => copyToClipboard(formData.qa_hosting_password, 'qa_hosting_pass')}
                  >
                    {copiedField === 'qa_hosting_pass' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hosting Producción */}
      <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-[var(--text-primary)]">
            <Badge className="bg-green-500">PROD</Badge>
            Hosting de Producción
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">URL</Label>
            <div className="flex gap-2">
              <Input
                value={formData.prod_hosting_url}
                onChange={(e) => setFormData({ ...formData, prod_hosting_url: e.target.value })}
                placeholder="https://www.ejemplo.com"
                className="bg-[var(--bg-input)]"
              />
              {formData.prod_hosting_url && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(formData.prod_hosting_url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div>
            <Label className="text-xs">Usuario</Label>
            <div className="relative">
              <Input
                value={formData.prod_hosting_user}
                onChange={(e) => setFormData({ ...formData, prod_hosting_user: e.target.value })}
                placeholder="usuario@ejemplo.com"
                className="bg-[var(--bg-input)] pr-10"
              />
              {formData.prod_hosting_user && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => copyToClipboard(formData.prod_hosting_user, 'prod_hosting_user')}
                >
                  {copiedField === 'prod_hosting_user' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </div>
          <div>
            <Label className="text-xs">Contraseña</Label>
            <div className="relative">
              <Input
                value={formData.prod_hosting_password}
                onChange={(e) => setFormData({ ...formData, prod_hosting_password: e.target.value })}
                placeholder="••••••••"
                type={showPasswords['prod_hosting'] ? 'text' : 'password'}
                className="bg-[var(--bg-input)] pr-20"
              />
              <div className="absolute top-1/2 -translate-y-1/2 right-1 flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => togglePasswordVisibility('prod_hosting')}
                >
                  {showPasswords['prod_hosting'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                {formData.prod_hosting_password && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => copyToClipboard(formData.prod_hosting_password, 'prod_hosting_pass')}
                  >
                    {copiedField === 'prod_hosting_pass' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CMS QA */}
      <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-[var(--text-primary)]">
            <Badge className="bg-blue-500">QA</Badge>
            CMS - QA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">URL</Label>
            <div className="flex gap-2">
              <Input
                value={formData.cms_qa_url}
                onChange={(e) => setFormData({ ...formData, cms_qa_url: e.target.value })}
                placeholder="https://cms-qa.ejemplo.com"
                className="bg-[var(--bg-input)]"
              />
              {formData.cms_qa_url && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(formData.cms_qa_url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div>
            <Label className="text-xs">Usuario</Label>
            <div className="relative">
              <Input
                value={formData.cms_qa_user}
                onChange={(e) => setFormData({ ...formData, cms_qa_user: e.target.value })}
                placeholder="usuario@ejemplo.com"
                className="bg-[var(--bg-input)] pr-10"
              />
              {formData.cms_qa_user && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => copyToClipboard(formData.cms_qa_user, 'cms_qa_user')}
                >
                  {copiedField === 'cms_qa_user' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </div>
          <div>
            <Label className="text-xs">Contraseña</Label>
            <div className="relative">
              <Input
                value={formData.cms_qa_password}
                onChange={(e) => setFormData({ ...formData, cms_qa_password: e.target.value })}
                placeholder="••••••••"
                type={showPasswords['cms_qa'] ? 'text' : 'password'}
                className="bg-[var(--bg-input)] pr-20"
              />
              <div className="absolute top-1/2 -translate-y-1/2 right-1 flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => togglePasswordVisibility('cms_qa')}
                >
                  {showPasswords['cms_qa'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                {formData.cms_qa_password && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => copyToClipboard(formData.cms_qa_password, 'cms_qa_pass')}
                  >
                    {copiedField === 'cms_qa_pass' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CMS Producción */}
      <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-[var(--text-primary)]">
            <Badge className="bg-green-500">PROD</Badge>
            CMS - Producción
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">URL</Label>
            <div className="flex gap-2">
              <Input
                value={formData.cms_prod_url}
                onChange={(e) => setFormData({ ...formData, cms_prod_url: e.target.value })}
                placeholder="https://cms.ejemplo.com"
                className="bg-[var(--bg-input)]"
              />
              {formData.cms_prod_url && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(formData.cms_prod_url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div>
            <Label className="text-xs">Usuario</Label>
            <div className="relative">
              <Input
                value={formData.cms_prod_user}
                onChange={(e) => setFormData({ ...formData, cms_prod_user: e.target.value })}
                placeholder="usuario@ejemplo.com"
                className="bg-[var(--bg-input)] pr-10"
              />
              {formData.cms_prod_user && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => copyToClipboard(formData.cms_prod_user, 'cms_prod_user')}
                >
                  {copiedField === 'cms_prod_user' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </div>
          <div>
            <Label className="text-xs">Contraseña</Label>
            <div className="relative">
              <Input
                value={formData.cms_prod_password}
                onChange={(e) => setFormData({ ...formData, cms_prod_password: e.target.value })}
                placeholder="••••••••"
                type={showPasswords['cms_prod'] ? 'text' : 'password'}
                className="bg-[var(--bg-input)] pr-20"
              />
              <div className="absolute top-1/2 -translate-y-1/2 right-1 flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => togglePasswordVisibility('cms_prod')}
                >
                  {showPasswords['cms_prod'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                {formData.cms_prod_password && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => copyToClipboard(formData.cms_prod_password, 'cms_prod_pass')}
                  >
                    {copiedField === 'cms_prod_pass' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* APIs */}
      <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between text-[var(--text-primary)]">
            <span>APIs</span>
            <Button
              size="sm"
              onClick={handleAddApi}
              className="bg-[#FF1B7E] hover:bg-[#e6156e]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar API
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.apis.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)] text-center py-4">
              No hay APIs agregadas
            </p>
          ) : (
            formData.apis.map((api, index) => (
              <Card key={index} className="bg-[var(--bg-tertiary)] border-[var(--border-secondary)]">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div>
                        <Label className="text-xs">Nombre de la API</Label>
                        <Input
                          value={api.name}
                          onChange={(e) => handleApiChange(index, 'name', e.target.value)}
                          placeholder="Nombre de la API"
                          className="bg-[var(--bg-input)]"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">URL</Label>
                        <div className="flex gap-2">
                          <Input
                            value={api.url}
                            onChange={(e) => handleApiChange(index, 'url', e.target.value)}
                            placeholder="https://api.ejemplo.com"
                            className="bg-[var(--bg-input)]"
                          />
                          {api.url && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => window.open(api.url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Usuario</Label>
                        <div className="relative">
                          <Input
                            value={api.user}
                            onChange={(e) => handleApiChange(index, 'user', e.target.value)}
                            placeholder="usuario / API key"
                            className="bg-[var(--bg-input)] pr-10"
                          />
                          {api.user && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                              onClick={() => copyToClipboard(api.user, `api_user_${index}`)}
                            >
                              {copiedField === `api_user_${index}` ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Contraseña / Token</Label>
                        <div className="relative">
                          <Input
                            value={api.password}
                            onChange={(e) => handleApiChange(index, 'password', e.target.value)}
                            placeholder="••••••••"
                            type={showPasswords[`api_${index}`] ? 'text' : 'password'}
                            className="bg-[var(--bg-input)] pr-20"
                          />
                          <div className="absolute top-1/2 -translate-y-1/2 right-1 flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => togglePasswordVisibility(`api_${index}`)}
                            >
                              {showPasswords[`api_${index}`] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            {api.password && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => copyToClipboard(api.password, `api_pass_${index}`)}
                              >
                                {copiedField === `api_pass_${index}` ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveApi(index)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Botón Guardar */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="bg-[#FF1B7E] hover:bg-[#e6156e]"
        >
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? 'Guardando...' : 'Guardar Accesos'}
        </Button>
      </div>
    </div>
  );
}