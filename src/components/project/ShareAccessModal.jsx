import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';
import { Share2, Mail, Copy, Check, Calendar, X } from 'lucide-react';
import { toast } from 'sonner';

export default function ShareAccessModal({ isOpen, onClose, projectId, projectAccess }) {
  const [email, setEmail] = useState('');
  const [expirationDays, setExpirationDays] = useState('');
  const [permissions, setPermissions] = useState({
    qa_hosting: false,
    prod_hosting: false,
    cms_qa: false,
    cms_prod: false,
    apis: []
  });
  const [generatedToken, setGeneratedToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const apis = projectAccess?.apis || [];

  const handleApiToggle = (apiName) => {
    setPermissions(prev => ({
      ...prev,
      apis: prev.apis.includes(apiName) 
        ? prev.apis.filter(a => a !== apiName)
        : [...prev.apis, apiName]
    }));
  };

  const handleShare = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Ingresa un email válido');
      return;
    }

    const hasPermissions = permissions.qa_hosting || permissions.prod_hosting || 
                          permissions.cms_qa || permissions.cms_prod || 
                          permissions.apis.length > 0;

    if (!hasPermissions) {
      toast.error('Selecciona al menos un acceso para compartir');
      return;
    }

    setLoading(true);

    try {
      const expiresAt = expirationDays ? 
        new Date(Date.now() + parseInt(expirationDays) * 24 * 60 * 60 * 1000).toISOString() 
        : null;

      const response = await base44.functions.invoke('generateAccessToken', {
        projectId,
        sharedWithEmail: email,
        permissions,
        expiresAt
      });

      if (response.data.success) {
        setGeneratedToken(response.data.token);
        toast.success('Acceso compartido exitosamente');
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToken = () => {
    navigator.clipboard.writeText(generatedToken);
    setCopied(true);
    toast.success('Token copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  const resetForm = () => {
    setEmail('');
    setExpirationDays('');
    setPermissions({
      qa_hosting: false,
      prod_hosting: false,
      cms_qa: false,
      cms_prod: false,
      apis: []
    });
    setGeneratedToken('');
    setCopied(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-primary)] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Share2 className="h-5 w-5 text-[#FF1B7E]" />
            Compartir Accesos del Proyecto
          </DialogTitle>
        </DialogHeader>

        {!generatedToken ? (
          <div className="space-y-6 py-4">
            {/* Email del destinatario */}
            <div>
              <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email del destinatario
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@ejemplo.com"
                className="bg-[var(--bg-input)]"
              />
            </div>

            {/* Expiración */}
            <div>
              <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Expiración (opcional)
              </Label>
              <Input
                type="number"
                value={expirationDays}
                onChange={(e) => setExpirationDays(e.target.value)}
                placeholder="Días hasta expiración (ej: 30)"
                className="bg-[var(--bg-input)]"
              />
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Dejar vacío para acceso sin expiración
              </p>
            </div>

            {/* Permisos */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Selecciona los accesos a compartir</Label>
              
              <div className="space-y-3 border border-[var(--border-primary)] rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="qa_hosting"
                    checked={permissions.qa_hosting}
                    onCheckedChange={(checked) => setPermissions(prev => ({ ...prev, qa_hosting: checked }))}
                  />
                  <label htmlFor="qa_hosting" className="text-sm cursor-pointer flex items-center gap-2">
                    <Badge className="bg-blue-500">QA</Badge>
                    Hosting de QA
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="prod_hosting"
                    checked={permissions.prod_hosting}
                    onCheckedChange={(checked) => setPermissions(prev => ({ ...prev, prod_hosting: checked }))}
                  />
                  <label htmlFor="prod_hosting" className="text-sm cursor-pointer flex items-center gap-2">
                    <Badge className="bg-green-500">PROD</Badge>
                    Hosting de Producción
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="cms_qa"
                    checked={permissions.cms_qa}
                    onCheckedChange={(checked) => setPermissions(prev => ({ ...prev, cms_qa: checked }))}
                  />
                  <label htmlFor="cms_qa" className="text-sm cursor-pointer flex items-center gap-2">
                    <Badge className="bg-blue-500">QA</Badge>
                    CMS - QA
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="cms_prod"
                    checked={permissions.cms_prod}
                    onCheckedChange={(checked) => setPermissions(prev => ({ ...prev, cms_prod: checked }))}
                  />
                  <label htmlFor="cms_prod" className="text-sm cursor-pointer flex items-center gap-2">
                    <Badge className="bg-green-500">PROD</Badge>
                    CMS - Producción
                  </label>
                </div>

                {apis.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[var(--border-primary)]">
                    <p className="text-sm font-medium mb-2">APIs</p>
                    <div className="space-y-2">
                      {apis.map((api, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Checkbox
                            id={`api_${index}`}
                            checked={permissions.apis.includes(api.name)}
                            onCheckedChange={() => handleApiToggle(api.name)}
                          />
                          <label htmlFor={`api_${index}`} className="text-sm cursor-pointer">
                            {api.name || `API ${index + 1}`}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button 
                onClick={handleShare}
                disabled={loading}
                className="bg-[#FF1B7E] hover:bg-[#e6156e]"
              >
                {loading ? 'Generando...' : 'Compartir Acceso'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                ✓ Acceso compartido exitosamente con <strong>{email}</strong>
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                Se ha enviado un email con el token de acceso
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2">Token de Acceso</Label>
              <div className="flex gap-2">
                <Input
                  value={generatedToken}
                  readOnly
                  className="bg-[var(--bg-input)] font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToken}
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-2">
                Este token permite acceso solo de lectura a las secciones seleccionadas
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button onClick={resetForm} variant="outline">
                Compartir con otro usuario
              </Button>
              <Button onClick={handleClose} className="bg-[#FF1B7E] hover:bg-[#e6156e]">
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}