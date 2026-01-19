import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const NEW_ACTIVATION_CRITERIA = [
  {
    area: 'Brief del Proyecto',
    title: 'Objetivos de negocio y generalidades del proyecto',
    description: 'Objetivos de negocio y generalidades del proyecto',
    is_mandatory: true
  },
  {
    area: 'Brief del Proyecto',
    title: 'Contexto y Antecedentes del proyecto',
    description: 'Contexto y Antecedentes del proyecto',
    is_mandatory: true
  },
  {
    area: 'Brief del Proyecto',
    title: 'Entregables: Listado táctico de qué se va a recibir',
    description: 'Entregables: Listado táctico de qué se va a recibir',
    is_mandatory: true
  },
  {
    area: 'Brief del Proyecto',
    title: 'Hoja de vida del proyecto cargada',
    description: 'Hoja de vida del proyecto cargada',
    is_mandatory: true
  },
  {
    area: 'Brief del Proyecto',
    title: 'Insumos base recopilados y organizados',
    description: 'Insumos base recopilados y organizados',
    is_mandatory: false
  }
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Obtener todos los proyectos
    const projects = await base44.asServiceRole.entities.Project.list();
    
    let updatedProjects = 0;
    const results = [];

    for (const project of projects) {
      // Obtener criterios de entrada actuales de la fase activation
      const existingCriteria = await base44.asServiceRole.entities.EntryCriteria.filter({
        project_id: project.id,
        phase_key: 'activation'
      });

      // Eliminar criterios antiguos
      for (const criterion of existingCriteria) {
        await base44.asServiceRole.entities.EntryCriteria.delete(criterion.id);
      }

      // Crear nuevos criterios
      for (const newCriterion of NEW_ACTIVATION_CRITERIA) {
        await base44.asServiceRole.entities.EntryCriteria.create({
          project_id: project.id,
          phase_key: 'activation',
          ...newCriterion
        });
      }

      updatedProjects++;
      results.push({
        projectId: project.id,
        projectName: project.name,
        oldCriteriaCount: existingCriteria.length,
        newCriteriaCount: NEW_ACTIVATION_CRITERIA.length
      });
    }

    return Response.json({
      success: true,
      message: `Criterios de activación actualizados en ${updatedProjects} proyectos`,
      results
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});