import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userEmail, userName } = await req.json();

    // Enviar email a Geraldine
    await base44.integrations.Core.SendEmail({
      from_name: "Control QA - Sistema",
      to: "geraldine.hurtado@antpack.co",
      subject: "Nuevo usuario registrado en Control QA",
      body: `
        <h2>Nuevo Usuario Registrado</h2>
        <p>Se ha registrado un nuevo usuario en el sistema Control QA:</p>
        <ul>
          <li><strong>Email:</strong> ${userEmail}</li>
          <li><strong>Nombre:</strong> ${userName || 'No especificado'}</li>
        </ul>
        <p>Por favor, accede al panel administrativo para asignar el rol correspondiente a este usuario.</p>
        <p><a href="${Deno.env.get('APP_URL') || 'https://app.base44.com'}" style="background: #FF1B7E; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Ir al Panel Admin</a></p>
      `
    });

    return Response.json({ 
      success: true, 
      message: 'Notificación enviada a Geraldine' 
    });
  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});