import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const body = await req.json();
    const { token, recipient_email, recipient_name, project_name, access_title, access_count } = body;

    if (!token || !recipient_email || !recipient_name) {
      return Response.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    const APP_ID = Deno.env.get('BASE44_APP_ID');
    const accessUrl = `https://${APP_ID}.base44.run/SharedAccess?token=${token}`;
    
    const accessDescription = access_count > 1 
      ? `${access_count} accesos` 
      : (access_title || 'un recurso');

    const emailBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #FF1B7E 0%, #e6156e 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🔐 Acceso Compartido</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #1a1a1a; margin-top: 0;">Hola ${recipient_name},</p>
          
          <p style="font-size: 14px; color: #525252; line-height: 1.6;">
            Se te ha compartido de forma segura <strong>${accessDescription}</strong>
            ${project_name ? ` del proyecto <strong>${project_name}</strong>` : ''}.
          </p>

          <div style="background: #f8f9fa; border-left: 4px solid #FF1B7E; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 13px; color: #525252;">
              ⚠️ Este enlace es temporal y expirará en 48 horas. No lo compartas con terceros.
            </p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${accessUrl}" 
               style="display: inline-block; background: #FF1B7E; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
              Ver Acceso
            </a>
          </div>

          <p style="font-size: 13px; color: #737373; margin-bottom: 0;">
            Si no esperabas este correo, puedes ignorarlo con seguridad.
          </p>
        </div>

        <div style="text-align: center; padding: 20px; color: #a3a3a3; font-size: 12px;">
          <p style="margin: 0;">Este es un correo automático, por favor no respondas.</p>
        </div>
      </div>
    `;

    const subject = access_count > 1 
      ? `🔐 Acceso compartido: ${access_count} recursos del proyecto`
      : `🔐 Acceso compartido: ${access_title || 'Recurso del proyecto'}`;

    const result = await base44.asServiceRole.integrations.Core.SendEmail({
      to: recipient_email,
      subject: subject,
      body: emailBody
    });
    
    console.log('Email sent successfully to:', recipient_email, result);

    return Response.json({ success: true, result, email: recipient_email });
  } catch (error) {
    console.error('Error sending access email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});