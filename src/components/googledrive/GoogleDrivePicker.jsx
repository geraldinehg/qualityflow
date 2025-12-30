import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Loader2 } from 'lucide-react';

export default function GoogleDrivePicker({ isOpen, onClose, onSelect }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadGooglePicker();
    }
  }, [isOpen]);

  const loadGooglePicker = async () => {
    setLoading(true);
    setError(null);
    try {
      // Obtener access token del usuario actual
      const token = await base44.connectors.getAccessToken('googledrive');
      
      // Cargar scripts de Google Picker
      await loadScript('https://apis.google.com/js/api.js');
      await new Promise(resolve => window.gapi.load('picker', resolve));
      
      // Abrir el picker
      openPicker(token);
      setLoading(false);
    } catch (error) {
      console.error('Error loading Google Picker:', error);
      setError('No se pudo conectar con Google Drive. Intenta de nuevo.');
      setLoading(false);
    }
  };

  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  };

  const openPicker = (token) => {
    const picker = new window.google.picker.PickerBuilder()
      .addView(window.google.picker.ViewId.DOCS)
      .setOAuthToken(token)
      .setCallback((data) => {
        if (data.action === window.google.picker.Action.PICKED) {
          const file = data.docs[0];
          onSelect({
            id: file.id,
            name: file.name,
            url: file.url,
            mimeType: file.mimeType,
            thumbnailLink: file.iconUrl
          });
          onClose();
        } else if (data.action === window.google.picker.Action.CANCEL) {
          onClose();
        }
      })
      .build();
    
    picker.setVisible(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#1a1a1a] border-[#2a2a2a] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4285F4] to-[#34A853] flex items-center justify-center shadow-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            Google Drive
          </DialogTitle>
          <p className="text-sm text-gray-400 mt-2">Selecciona archivos de tu Google Drive</p>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-[#4285F4] mb-4" />
            <p className="text-sm text-gray-400">Cargando Google Drive...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-10 w-10 text-red-500" />
            </div>
            <p className="text-sm text-red-400 mb-4">{error}</p>
            <button 
              onClick={() => loadGooglePicker()}
              className="text-sm text-[#4285F4] hover:underline"
            >
              Intentar de nuevo
            </button>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#4285F4]/10 to-[#34A853]/10 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-10 w-10 text-[#4285F4]" />
            </div>
            <p className="text-sm text-gray-300 mb-2">
              Se abrirá el selector de Google Drive
            </p>
            <p className="text-xs text-gray-500">
              Selecciona los archivos de tu cuenta
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}