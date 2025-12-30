import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, FileText, File, Image, Search } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const FILE_ICONS = {
  'application/vnd.google-apps.document': FileText,
  'application/vnd.google-apps.spreadsheet': FileText,
  'application/vnd.google-apps.presentation': FileText,
  'application/pdf': FileText,
  'image/': Image,
};

const getFileIcon = (mimeType) => {
  for (const [type, Icon] of Object.entries(FILE_ICONS)) {
    if (mimeType.startsWith(type)) return Icon;
  }
  return File;
};

export default function GoogleDrivePicker({ isOpen, onClose, onSelect }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadFiles();
    }
  }, [isOpen]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('googleDrivePicker', {
        action: 'listFiles'
      });
      setFiles(data.files || []);
    } catch (error) {
      console.error('Error cargando archivos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async () => {
    if (!selectedFile) return;
    
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('googleDrivePicker', {
        action: 'getFileMetadata',
        fileId: selectedFile.id
      });
      
      onSelect({
        id: data.id,
        name: data.name,
        url: data.webViewLink,
        mimeType: data.mimeType,
        thumbnailLink: data.thumbnailLink
      });
      onClose();
    } catch (error) {
      console.error('Error seleccionando archivo:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-[#1a1a1a] border-[#2a2a2a] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4285F4] to-[#34A853] flex items-center justify-center shadow-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            Google Drive
          </DialogTitle>
          <p className="text-sm text-gray-400 mt-2">Selecciona un archivo de tu cuenta</p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar archivos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500"
            />
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-[#4285F4] mb-4" />
              <p className="text-sm text-gray-400">Conectando con tu Google Drive...</p>
            </div>
          ) : (
            <ScrollArea className="h-[420px] border border-[#2a2a2a] rounded-xl p-3 bg-[#0a0a0a]/50">
              <div className="space-y-2">
                {filteredFiles.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#4285F4]/10 to-[#34A853]/10 flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-10 w-10 text-gray-600" />
                    </div>
                    <p className="text-base font-medium text-gray-300 mb-1">
                      {searchQuery ? 'No se encontraron archivos' : 'No hay archivos disponibles'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {searchQuery ? 'Intenta con otro término' : 'Sube archivos a tu Google Drive primero'}
                    </p>
                  </div>
                ) : (
                  filteredFiles.map((file) => {
                    const Icon = getFileIcon(file.mimeType);
                    const isSelected = selectedFile?.id === file.id;
                    
                    return (
                      <button
                        key={file.id}
                        onClick={() => setSelectedFile(file)}
                        className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all group ${
                          isSelected 
                            ? 'bg-gradient-to-r from-[#4285F4]/20 to-[#34A853]/20 border-[#4285F4] shadow-lg shadow-[#4285F4]/20' 
                            : 'bg-[#0a0a0a] border-[#2a2a2a] hover:border-[#4285F4]/50 hover:bg-[#2a2a2a]/30'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          isSelected 
                            ? 'bg-gradient-to-br from-[#4285F4] to-[#34A853]' 
                            : 'bg-[#1a1a1a] group-hover:bg-[#2a2a2a]'
                        }`}>
                          <Icon className={`h-6 w-6 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(file.modifiedTime).toLocaleDateString('es-ES', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </p>
                        </div>
                        {isSelected && (
                          <Badge className="bg-[#4285F4] text-white border-0 shadow-lg">
                            ✓ Seleccionado
                          </Badge>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="bg-white hover:bg-gray-100 text-black">
            Cancelar
          </Button>
          <Button 
            onClick={handleSelect} 
            disabled={!selectedFile || loading}
            className="bg-[#FF1B7E] hover:bg-[#e6156e] text-white"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Seleccionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}