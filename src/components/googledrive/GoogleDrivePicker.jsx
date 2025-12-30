import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Loader2, Link2 } from 'lucide-react';

export default function GoogleDrivePicker({ isOpen, onClose, onSelect }) {
  const [driveUrl, setDriveUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const extractFileIdFromUrl = (url) => {
    const patterns = [
      /\/d\/([a-zA-Z0-9-_]+)/,
      /id=([a-zA-Z0-9-_]+)/,
      /folders\/([a-zA-Z0-9-_]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleSubmit = async () => {
    setError('');
    
    if (!driveUrl.trim()) {
      setError('Por favor ingresa un enlace de Google Drive');
      return;
    }

    const fileId = extractFileIdFromUrl(driveUrl);
    if (!fileId) {
      setError('El enlace no es válido. Usa un enlace de Google Drive');
      return;
    }

    setLoading(true);
    try {
      onSelect({
        id: fileId,
        name: fileName || 'Documento de Google Drive',
        url: driveUrl,
        mimeType: 'application/vnd.google-apps.document'
      });
      setDriveUrl('');
      setFileName('');
      onClose();
    } catch (error) {
      setError('Error al vincular el archivo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#1a1a1a] border-[#2a2a2a] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4285F4] to-[#34A853] flex items-center justify-center shadow-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            Vincular desde Google Drive
          </DialogTitle>
          <p className="text-sm text-gray-400 mt-2">Pega el enlace del archivo de Google Drive</p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="drive-url" className="text-white">Enlace de Google Drive *</Label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                id="drive-url"
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                className="pl-9 bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500"
              />
            </div>
            <p className="text-xs text-gray-500">
              Copia el enlace compartible del archivo desde Google Drive
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-name" className="text-white">Nombre del archivo (opcional)</Label>
            <Input
              id="file-name"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Ej: Propuesta del proyecto"
              className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline" className="bg-white hover:bg-gray-100 text-black border-white">
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading}
            className="bg-gradient-to-r from-[#4285F4] to-[#34A853] hover:from-[#3367D6] hover:to-[#2D8E47] text-white"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Vincular
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}