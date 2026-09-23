import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { form_token } = await req.json();

    if (!form_token) {
      return Response.json({ error: 'Token requerido' }, { status: 400 });
    }

    // Buscar configuración del formulario usando service role (no requiere auth)
    const forms = await base44.asServiceRole.entities.TaskFormPublicUrl.filter({
      form_token,
      is_active: true
    });

    if (!forms || forms.length === 0) {
      return Response.json({ error: 'Formulario no encontrado o inactivo' }, { status: 404 });
    }

    const form = forms[0];

    // Cargar configuración de tareas
    const configs = await base44.asServiceRole.entities.TaskConfiguration.filter({
      project_id: form.project_id
    });

    return Response.json({
      success: true,
      data: {
        ...form,
        taskConfig: configs[0]
      }
    });

  } catch (error) {
    console.error('Error in getPublicForm:', error);
    return Response.json(
      { error: 'Error al cargar formulario', details: error.message },
      { status: 500 }
    );
  }
});