import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Obtener el token de acceso de Google Drive del usuario actual
    const accessToken = await base44.connectors.getAccessToken('googledrive');
    
    const { action, fileId } = await req.json();
    
    if (action === 'getFileMetadata' && fileId) {
      // Obtener metadata del archivo
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,webViewLink,iconLink,thumbnailLink`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Error al obtener metadata del archivo');
      }
      
      const fileData = await response.json();
      return Response.json(fileData);
    }
    
    if (action === 'listFiles') {
      // Listar archivos del usuario
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?pageSize=100&fields=files(id,name,mimeType,webViewLink,iconLink,modifiedTime)&orderBy=modifiedTime desc`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Error al listar archivos');
      }
      
      const data = await response.json();
      return Response.json(data);
    }
    
    return Response.json({ error: 'Acción no válida' }, { status: 400 });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});