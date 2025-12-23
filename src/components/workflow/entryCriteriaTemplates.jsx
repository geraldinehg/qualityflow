export const DEFAULT_ENTRY_CRITERIA = {
  activation: [
    // Criterios Generales
    {
      area: 'Criterios Generales',
      title: 'Brief del Proyecto',
      description: 'Objetivos claros y problema que resuelve el proyecto',
      is_mandatory: true
    },
    {
      area: 'Criterios Generales',
      title: 'Equipo y Roles Definidos',
      description: 'Quién aprueba, quién ejecuta, responsabilidades claras',
      is_mandatory: true
    },
    {
      area: 'Criterios Generales',
      title: 'Cronograma Definido',
      description: 'Fecha de inicio, hitos principales y entrega final',
      is_mandatory: true
    },
    {
      area: 'Criterios Generales',
      title: 'Listado de Entregables',
      description: 'Entregables tácticos definidos y documentados',
      is_mandatory: true
    },
    
    // Creatividad y Diseño
    {
      area: 'Creatividad y Diseño',
      title: 'Brand Guidelines',
      description: 'Manual de marca, logos, tipografías, colores',
      is_mandatory: true
    },
    {
      area: 'Creatividad y Diseño',
      title: 'Look & Feel / Referencias',
      description: 'Referencias visuales y estilo deseado',
      is_mandatory: true
    },
    {
      area: 'Creatividad y Diseño',
      title: 'Tono de Voz',
      description: 'Definición del tono de comunicación de la marca',
      is_mandatory: true
    },
    {
      area: 'Creatividad y Diseño',
      title: 'Copywriting Base',
      description: 'Textos mínimos obligatorios para el proyecto',
      is_mandatory: true
    },
    
    // Software y Desarrollo
    {
      area: 'Software y Desarrollo',
      title: 'Stack Tecnológico',
      description: 'Lenguaje/Plataforma definida y aprobada',
      is_mandatory: true
    },
    {
      area: 'Software y Desarrollo',
      title: 'Requerimientos Funcionales',
      description: 'Casos de uso del sistema documentados',
      is_mandatory: true
    },
    {
      area: 'Software y Desarrollo',
      title: 'Accesos y Credenciales',
      description: 'Acceso a servidores, APIs y servicios necesarios',
      is_mandatory: true
    },
    {
      area: 'Software y Desarrollo',
      title: 'Entornos Configurados',
      description: 'Staging y Producción listos',
      is_mandatory: true
    },
    {
      area: 'Software y Desarrollo',
      title: 'Criterios de Aceptación',
      description: 'Definición de lo que significa "terminado"',
      is_mandatory: true
    },
    
    // SEO
    {
      area: 'SEO',
      title: 'Keyword Research Inicial',
      description: 'Investigación de palabras clave completada',
      is_mandatory: true
    },
    {
      area: 'SEO',
      title: 'Arquitectura de Información',
      description: 'Mapa de navegación y estructura del sitio',
      is_mandatory: true
    },
    {
      area: 'SEO',
      title: 'Herramientas de Medición',
      description: 'Accesos a Google Search Console y GA4',
      is_mandatory: true
    },
    {
      area: 'SEO',
      title: 'Benchmarking SEO',
      description: 'Análisis de competencia y mejores prácticas',
      is_mandatory: true
    },
    
    // Marketing - Paid
    {
      area: 'Marketing - Paid',
      title: 'Definición de Target',
      description: 'Buyer Persona documentado',
      is_mandatory: true
    },
    {
      area: 'Marketing - Paid',
      title: 'Propuesta de Valor',
      description: 'Propuesta única de valor definida',
      is_mandatory: true
    },
    {
      area: 'Marketing - Paid',
      title: 'KPIs Definidos',
      description: 'Métricas clave de éxito establecidas',
      is_mandatory: true
    },
    {
      area: 'Marketing - Paid',
      title: 'Canales de Difusión',
      description: 'Canales de marketing y pauta definidos',
      is_mandatory: true
    },
    {
      area: 'Marketing - Paid',
      title: 'Tracking de Pauta',
      description: 'Píxeles de Meta, Google Ads y tracking configurados',
      is_mandatory: true
    },
    
    // Web y Mantenimiento
    {
      area: 'Web y Mantenimiento',
      title: 'SLA Definido',
      description: 'Acuerdos de Nivel de Servicio documentados',
      is_mandatory: true
    },
    {
      area: 'Web y Mantenimiento',
      title: 'Backups y Seguridad',
      description: 'Estrategia de respaldos y seguridad definida',
      is_mandatory: true
    },
    {
      area: 'Web y Mantenimiento',
      title: 'Licenciamiento',
      description: 'Licencias de software y servicios gestionadas',
      is_mandatory: true
    },
    {
      area: 'Web y Mantenimiento',
      title: 'Matriz de Escalación',
      description: 'Procesos de escalación de incidentes definidos',
      is_mandatory: true
    }
  ],
  
  planning: [
    {
      area: 'Planeación',
      title: 'Tareas por Área Registradas',
      description: 'Todas las áreas han registrado sus tareas en el cronograma',
      is_mandatory: true
    },
    {
      area: 'Planeación',
      title: 'Dependencias Identificadas',
      description: 'Dependencias entre tareas y áreas documentadas',
      is_mandatory: true
    }
  ]
};