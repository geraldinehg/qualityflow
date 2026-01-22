import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, sharedWithEmail, permissions, expiresAt } = await req.json();

    if (!projectId || !sharedWithEmail || !permissions) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generar token único y seguro
    const tokenArray = new Uint8Array(32);
    crypto.getRandomValues(tokenArray);
    const token = Array.from(tokenArray, byte => byte.toString(16).padStart(2, '0')).join('');

    // Crear registro de acceso compartido
    const sharedAccess = await base44.asServiceRole.entities.SharedProjectAccess.create({
      project_id: projectId,
      shared_by: user.email,
      shared_with_email: sharedWithEmail,
      access_token: token,
      permissions,
      expires_at: expiresAt || null,
      is_active: true
    });

    // Registrar la acción
    await base44.asServiceRole.entities.AccessLog.create({
      project_id: projectId,
      shared_access_id: sharedAccess.id,
      accessed_by: user.email,
      action: 'token_generated',
      section: 'share_access'
    });

    const isAntpackUser = sharedWithEmail.endsWith('@antpack.co');

    console.log('Sharing access with:', sharedWithEmail);
    console.log('Is Antpack user:', isAntpackUser);

    // Si NO es usuario de @antpack.co, generar PDF con los accesos
    if (!isAntpackUser) {
      // Obtener datos del proyecto y accesos
      const projectData = await base44.asServiceRole.entities.Project.filter({ id: projectId });
      const projectAccess = await base44.asServiceRole.entities.ProjectAccess.filter({ project_id: projectId });

      if (projectData.length && projectAccess.length) {
        const project = projectData[0];
        const access = projectAccess[0];

        // Crear PDF
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.text('Accesos Compartidos', 20, 20);
        
        doc.setFontSize(12);
        doc.text(`Proyecto: ${project.name}`, 20, 35);
        doc.text(`Compartido por: ${user.full_name || user.email}`, 20, 42);
        doc.text(`Token de acceso: ${token}`, 20, 49);
        
        if (expiresAt) {
          doc.text(`Expira: ${new Date(expiresAt).toLocaleDateString()}`, 20, 56);
        }

        let y = 70;
        doc.setFontSize(14);
        doc.text('Credenciales de Acceso:', 20, y);
        y += 10;

        doc.setFontSize(10);

        // Hosting QA
        if (permissions.qa_hosting && access.qa_hosting_url) {
          doc.setFontSize(12);
          doc.text('Hosting QA:', 20, y);
          y += 7;
          doc.setFontSize(10);
          if (access.qa_hosting_url) doc.text(`URL: ${access.qa_hosting_url}`, 25, y), y += 6;
          if (access.qa_hosting_user) doc.text(`Usuario: ${access.qa_hosting_user}`, 25, y), y += 6;
          if (access.qa_hosting_password) doc.text(`Contraseña: ${access.qa_hosting_password}`, 25, y), y += 6;
          y += 5;
        }

        // Hosting Producción
        if (permissions.prod_hosting && access.prod_hosting_url) {
          doc.setFontSize(12);
          doc.text('Hosting Producción:', 20, y);
          y += 7;
          doc.setFontSize(10);
          if (access.prod_hosting_url) doc.text(`URL: ${access.prod_hosting_url}`, 25, y), y += 6;
          if (access.prod_hosting_user) doc.text(`Usuario: ${access.prod_hosting_user}`, 25, y), y += 6;
          if (access.prod_hosting_password) doc.text(`Contraseña: ${access.prod_hosting_password}`, 25, y), y += 6;
          y += 5;
        }

        // CMS QA
        if (permissions.cms_qa && access.cms_qa_url) {
          doc.setFontSize(12);
          doc.text('CMS QA:', 20, y);
          y += 7;
          doc.setFontSize(10);
          if (access.cms_qa_url) doc.text(`URL: ${access.cms_qa_url}`, 25, y), y += 6;
          if (access.cms_qa_user) doc.text(`Usuario: ${access.cms_qa_user}`, 25, y), y += 6;
          if (access.cms_qa_password) doc.text(`Contraseña: ${access.cms_qa_password}`, 25, y), y += 6;
          y += 5;
        }

        // CMS Producción
        if (permissions.cms_prod && access.cms_prod_url) {
          doc.setFontSize(12);
          doc.text('CMS Producción:', 20, y);
          y += 7;
          doc.setFontSize(10);
          if (access.cms_prod_url) doc.text(`URL: ${access.cms_prod_url}`, 25, y), y += 6;
          if (access.cms_prod_user) doc.text(`Usuario: ${access.cms_prod_user}`, 25, y), y += 6;
          if (access.cms_prod_password) doc.text(`Contraseña: ${access.cms_prod_password}`, 25, y), y += 6;
          y += 5;
        }

        // APIs
        if (permissions.apis && permissions.apis.length > 0 && access.apis) {
          doc.setFontSize(12);
          doc.text('APIs:', 20, y);
          y += 7;
          doc.setFontSize(10);
          
          const allowedApis = access.apis.filter(api => permissions.apis.includes(api.name));
          allowedApis.forEach(api => {
            doc.text(`${api.name}:`, 25, y);
            y += 6;
            if (api.url) doc.text(`  URL: ${api.url}`, 30, y), y += 6;
            if (api.key) doc.text(`  Key: ${api.key}`, 30, y), y += 6;
            y += 3;
          });
        }

        // Convertir PDF a bytes
        const pdfBytes = doc.output('arraybuffer');
        const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));
        
        // Subir PDF
        const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
        const pdfFile = new File([pdfBlob], `accesos_${project.name.replace(/\s+/g, '_')}.pdf`, { type: 'application/pdf' });
        
        const uploadResult = await base44.integrations.Core.UploadFile({ file: pdfFile });

        // Enviar email con PDF adjunto
        console.log('Sending PDF email to external user...');
        const emailResult = await base44.integrations.Core.SendEmail({
          to: sharedWithEmail,
          subject: `Accesos compartidos - ${project.name}`,
          body: `${user.full_name || user.email} te ha compartido acceso al proyecto "${project.name}".\n\nTu token de acceso es: ${token}\n\nAdjunto encontrarás un PDF con todas las credenciales de acceso.\n\nEste acceso es de solo lectura y ${expiresAt ? `expira el ${new Date(expiresAt).toLocaleDateString()}` : 'no tiene fecha de expiración'}.\n\nPDF: ${uploadResult.file_url}`
        });
        console.log('Email sent result:', emailResult);
      }
    } else {
      // Usuario de @antpack.co - enviar email simple
      console.log('Sending email to Antpack user...');
      const emailResult = await base44.integrations.Core.SendEmail({
        to: sharedWithEmail,
        subject: `Te han compartido acceso al proyecto`,
        body: `${user.full_name || user.email} te ha compartido acceso a un proyecto.\n\nToken de acceso: ${token}\n\nPuedes ver los accesos compartidos en tu panel de control en la sección "Accesos Compartidos".`
      });
      console.log('Email sent result:', emailResult);
    }

    console.log('Access shared successfully');
    
    return Response.json({ 
      success: true, 
      token,
      sharedAccessId: sharedAccess.id,
      isAntpackUser
    });

  } catch (error) {
    console.error('Error in generateAccessToken:', error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});