export const DEFAULT_ENTRY_CRITERIA = {
  activation: [
    {
      area: 'Criterios Generales',
      title: 'Brief del Proyecto: Objetivos de negocio y generalidades del proyecto',
      description: 'Objetivos claros y problema que resuelve el proyecto',
      is_mandatory: true
    },
    {
      area: 'Criterios Generales',
      title: 'Equipo y roles: Quién aprueba, quién ejecuta por área, clientes',
      description: 'Quién aprueba, quién ejecuta, responsabilidades claras',
      is_mandatory: true
    },
    {
      area: 'Criterios Generales',
      title: 'Cronograma',
      description: 'Fecha de inicio, hitos principales y entrega final',
      is_mandatory: true
    },
    {
      area: 'Criterios Generales',
      title: 'Contexto y Antecedentes',
      description: 'Contexto del proyecto y antecedentes relevantes',
      is_mandatory: true
    },
    {
      area: 'Criterios Generales',
      title: 'Entregables: Listado táctico de qué se va a recibir',
      description: 'Entregables tácticos definidos y documentados',
      is_mandatory: true
    },
    {
      area: 'Criterios Generales',
      title: 'Hoja de vida del proyecto',
      description: 'Documento de hoja de vida del proyecto',
      is_mandatory: true
    },
    {
      area: 'Criterios Generales',
      title: 'Insumos base',
      description: 'Insumos base recopilados y organizados',
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
  ],
  
  design: [
    {
      area: 'Creatividad y Diseño',
      title: 'Brand Guidelines: Manual de marca, logos y tipografías',
      description: 'Manual de marca, logos, tipografías, colores',
      is_mandatory: true
    },
    {
      area: 'Creatividad y Diseño',
      title: 'Look & Feel / Referencias visuales',
      description: 'Referencias visuales y estilo deseado',
      is_mandatory: true
    },
    {
      area: 'Creatividad y Diseño',
      title: 'Tono de Voz: ¿Cómo habla el proyecto?',
      description: 'Definición del tono de comunicación de la marca',
      is_mandatory: true
    },
    {
      area: 'Creatividad y Diseño',
      title: 'Copy base: Textos mínimos obligatorios',
      description: 'Textos mínimos obligatorios para el proyecto',
      is_mandatory: true
    }
  ],

  web_development: [
    {
      area: 'Software y Desarrollo',
      title: 'Stack tecnológico: ¿En qué lenguaje o plataforma se debe construir?',
      description: 'Lenguaje/Plataforma definida y aprobada',
      is_mandatory: true
    },
    {
      area: 'Software y Desarrollo',
      title: 'Requerimientos funcionales: ¿Qué debe hacer el sistema? (Casos de uso)',
      description: 'Casos de uso del sistema documentados',
      is_mandatory: true
    },
    {
      area: 'Software y Desarrollo',
      title: 'Accesos y credenciales: Servidores, repositorios (GitHub/Bitbucket), APIs',
      description: 'Acceso a servidores, APIs y servicios necesarios',
      is_mandatory: true
    },
    {
      area: 'Software y Desarrollo',
      title: 'Entornos: Definición de ambiente de Pruebas (Staging), Dev y Producción',
      description: 'Staging y Producción listos',
      is_mandatory: true
    },
    {
      area: 'Software y Desarrollo',
      title: 'Criterios de aceptación: ¿Cuándo consideramos que una tarea "está lista"?',
      description: 'Definición de lo que significa "terminado"',
      is_mandatory: true
    },
    {
      area: 'Diseño',
      title: '¿Se cuenta con diseño mobile, desktop?',
      description: 'Diseño responsive disponible',
      is_mandatory: true
    },
    {
      area: 'Diseño',
      title: '¿Se cuenta con prototipo del diseño?',
      description: 'Prototipo interactivo disponible',
      is_mandatory: true
    },
    {
      area: 'Diseño',
      title: '¿Se tiene contemplado en el diseño textos extensos y la visualización?',
      description: 'Diseño contempla contenido dinámico',
      is_mandatory: true
    },
    {
      area: 'Diseño',
      title: '¿Se cuentan con referentes para las animaciones?',
      description: 'Referencias de animaciones definidas',
      is_mandatory: false
    },
    {
      area: 'Diseño',
      title: '¿El diseño cuenta con el check de la revisión de accesibilidad?',
      description: 'Revisión de accesibilidad completada',
      is_mandatory: true
    },
    {
      area: 'Producción',
      title: 'Ambiente de producción: Dominio final',
      description: 'Dominio final definido y configurado',
      is_mandatory: true
    },
    {
      area: 'Producción',
      title: 'Certificados SSL',
      description: 'Certificados SSL configurados',
      is_mandatory: true
    },
    {
      area: 'Producción',
      title: 'Accesos al servidor',
      description: 'Accesos al servidor de producción',
      is_mandatory: true
    },
    {
      area: 'Producción',
      title: 'Credenciales de producción de las herramientas implementadas',
      description: 'Credenciales de herramientas de producción',
      is_mandatory: true
    },
    {
      area: 'Producción',
      title: 'Configuración de backups del ambiente y de la base de datos',
      description: 'Backups configurados',
      is_mandatory: true
    },
    {
      area: 'Producción',
      title: 'Configuración y accesos del docker de producción',
      description: 'Docker de producción configurado',
      is_mandatory: false
    },
    {
      area: 'SEO y Analytics',
      title: 'Tags - Scripts',
      description: 'Tags de seguimiento y scripts implementados',
      is_mandatory: true
    }
  ],

  development: [
    {
      area: 'Software',
      title: 'Stack tecnológico definido',
      description: 'Tecnología y herramientas confirmadas',
      is_mandatory: true
    },
    {
      area: 'Software',
      title: 'Entornos configurados (Dev, Staging)',
      description: 'Ambientes de desarrollo listos',
      is_mandatory: true
    }
  ],

  seo: [
    {
      area: 'SEO',
      title: 'Accesos a herramientas de medición y control',
      description: 'Acceso a Google Search Console, Google Analytics (GA4) y Tag Manager',
      is_mandatory: true
    },
    {
      area: 'SEO',
      title: 'Dominio, subdominios y mercados activos',
      description: 'Dominio principal, subdominios, países, idiomas y entornos',
      is_mandatory: true
    },
    {
      area: 'SEO',
      title: 'Listado de URLs existentes',
      description: 'URLs actualmente publicadas y páginas clave del negocio',
      is_mandatory: true
    },
    {
      area: 'SEO',
      title: 'Estructura de navegación existente',
      description: 'Menú actual, jerarquía de páginas y estructura de URLs',
      is_mandatory: true
    },
    {
      area: 'SEO',
      title: 'Cambios previos o migraciones',
      description: 'Confirmación de migraciones anteriores y redirecciones existentes',
      is_mandatory: false
    },
    {
      area: 'SEO',
      title: 'Productos, servicios y prioridades comerciales',
      description: 'Qué vende la marca, qué es prioritario posicionar',
      is_mandatory: true
    },
    {
      area: 'SEO',
      title: 'Competidores percibidos por la marca',
      description: 'Listado de marcas o sitios que consideran competencia en buscadores',
      is_mandatory: true
    },
    {
      area: 'SEO',
      title: 'Limitaciones técnicas o legales',
      description: 'Restricciones de contenido, indexación, cumplimiento legal',
      is_mandatory: false
    }
  ],

  marketing_paid: [
    {
      area: 'Marketing - Paid',
      title: 'Acceso a las plataformas de pauta',
      description: 'Acceso a Google Ads, Meta Ads u otras plataformas activas',
      is_mandatory: true
    },
    {
      area: 'Marketing - Paid',
      title: 'Definición clara del objetivo de las campañas',
      description: 'Qué se espera lograr: leads, ventas, tráfico, reconocimiento',
      is_mandatory: true
    },
    {
      area: 'Marketing - Paid',
      title: 'Presupuesto de inversión',
      description: 'Monto mensual o por campaña definido para inversión en medios',
      is_mandatory: true
    },
    {
      area: 'Marketing - Paid',
      title: 'Buyer persona (si existen)',
      description: 'Perfiles de audiencia: geolocalización, demografía, intereses',
      is_mandatory: true
    },
    {
      area: 'Marketing - Paid',
      title: 'Ticket promedio',
      description: 'Valor promedio del producto o servicio a pautar',
      is_mandatory: true
    },
    {
      area: 'Marketing - Paid',
      title: 'Proceso comercial y atención',
      description: 'Flujo comercial y cómo se gestionan canales de contacto',
      is_mandatory: true
    }
  ],

  social_media: [
    {
      area: 'Social Media',
      title: 'Contexto de marca',
      description: 'Información base: qué hace la marca, qué vende, propósito, público objetivo',
      is_mandatory: true
    },
    {
      area: 'Social Media',
      title: 'Objetivo y alcance del proyecto',
      description: 'Objetivos, KPIs prioritarios, alcance esperado y tiempos',
      is_mandatory: true
    },
    {
      area: 'Social Media',
      title: 'Ecosistema digital y accesos',
      description: 'Listado de redes sociales y accesos a las cuentas',
      is_mandatory: true
    },
    {
      area: 'Social Media',
      title: 'Lineamientos de marca y comunicación',
      description: 'Manual de marca, tono y voz, pautas de comunicación',
      is_mandatory: true
    },
    {
      area: 'Social Media',
      title: 'Contenidos y activos disponibles',
      description: 'Banco de fotos, videos, piezas gráficas, materiales editables',
      is_mandatory: true
    },
    {
      area: 'Social Media',
      title: 'Grilla y frecuencia de contenidos',
      description: 'Cuántas publicaciones, en qué redes y periodicidad',
      is_mandatory: true
    },
    {
      area: 'Social Media',
      title: 'Influencers y colaboraciones',
      description: 'Lineamientos, perfiles, presupuesto, cronograma',
      is_mandatory: false
    },
    {
      area: 'Social Media',
      title: 'Protocolo de atención y reputación',
      description: 'Manejo de comentarios, mensajes sensibles, PQRS, crisis',
      is_mandatory: true
    },
    {
      area: 'Social Media',
      title: 'Brief operativo del proyecto',
      description: 'Documento con objetivos, KPIs, entregables y responsabilidades',
      is_mandatory: true
    },
    {
      area: 'Social Media',
      title: 'Contactos y seguimiento',
      description: 'Contactos responsables y periodicidad de reportes',
      is_mandatory: true
    }
  ],
  
  final_approval: [
    {
      area: 'Checklist de Cierre',
      title: 'QA Completo y Finalizado',
      description: 'Todas las pruebas de QA completadas y documentadas',
      is_mandatory: true
    },
    {
      area: 'Checklist de Cierre',
      title: 'Checklist General de Cada Área Completado',
      description: 'Verificar que todos los checklists por área estén al 100%',
      is_mandatory: true
    },
    {
      area: 'Checklist de Cierre',
      title: 'Aprobación de cada líder según los criterios añadidos',
      description: 'Cada líder de área aplicable ha aprobado',
      is_mandatory: true
    },
    {
      area: 'Checklist de Cierre',
      title: 'Aprobación de QA Designado',
      description: 'QA designado ha aprobado el estado final del proyecto',
      is_mandatory: true
    },
    {
      area: 'Checklist de Cierre',
      title: 'Plan de Migración (WEB) Documentado',
      description: 'Documento con plan de migración a producción adjunto',
      is_mandatory: true
    }
  ]
};