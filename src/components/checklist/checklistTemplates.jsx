// Plantillas de checklist por fase con configuración dinámica

export const PHASES = {
  documentation: { name: 'Brief del Proyecto', icon: 'FileText', order: 1, area: 'product' },
  planning: { name: 'Equipo y Cronograma', icon: 'Calendar', order: 2, area: 'product' },
  ux_ui: { name: 'Creatividad - Brand y Look & Feel', icon: 'Palette', order: 3, area: 'creativity' },
  content: { name: 'Creatividad - Copy y Contenido', icon: 'FileText', order: 4, area: 'creativity' },
  technical: { name: 'Software - Stack y Requerimientos', icon: 'Settings', order: 5, area: 'software' },
  development: { name: 'Software - Desarrollo', icon: 'Code', order: 6, area: 'software' },
  performance: { name: 'Software - Performance', icon: 'Zap', order: 7, area: 'software' },
  seo_accessibility: { name: 'SEO - Keywords y Arquitectura', icon: 'Search', order: 8, area: 'seo' },
  responsive: { name: 'QA - Responsive', icon: 'Smartphone', order: 9, area: 'qa' },
  qa: { name: 'QA - Testing', icon: 'CheckSquare', order: 10, area: 'qa' },
  security: { name: 'Software - Seguridad', icon: 'Shield', order: 11, area: 'software' },
  delivery: { name: 'Entrega Final', icon: 'Rocket', order: 12, area: 'product' }
};

export const WEIGHT_CONFIG = {
  low: { label: 'Bajo', color: 'bg-slate-100 text-slate-700', priority: 1 },
  medium: { label: 'Medio', color: 'bg-blue-100 text-blue-700', priority: 2 },
  high: { label: 'Alto', color: 'bg-amber-100 text-amber-700', priority: 3 },
  critical: { label: 'Crítico', color: 'bg-red-100 text-red-700', priority: 4 }
};

export const SITE_TYPE_CONFIG = {
  landing: { name: 'Landing Page', criticalPhases: ['documentation', 'ux_ui', 'responsive', 'performance'] },
  ecommerce: { name: 'E-commerce', criticalPhases: ['documentation', 'technical', 'performance', 'qa', 'security'] },
  corporate: { name: 'Corporativo', criticalPhases: ['documentation', 'planning', 'ux_ui', 'content'] },
  blog: { name: 'Blog', criticalPhases: ['documentation', 'content', 'performance', 'responsive'] },
  forms: { name: 'Formularios', criticalPhases: ['qa', 'security', 'development'] },
  webapp: { name: 'Web App', criticalPhases: ['security', 'qa', 'performance'] }
};

export const TECHNOLOGY_CONFIG = {
  wordpress: { name: 'WordPress', color: 'bg-blue-500' },
  webflow: { name: 'Webflow', color: 'bg-indigo-500' },
  custom: { name: 'Custom', color: 'bg-purple-500' },
  shopify: { name: 'Shopify', color: 'bg-green-500' }
};

export const ROLE_CONFIG = {
  web_leader: { name: 'Líder Web', color: 'bg-blue-500', canComplete: ['all'], isLeader: true },
  
  leader_product: { name: 'Líder Producto', color: 'bg-amber-600', canComplete: ['documentation', 'planning'], isLeader: true },
  product_owner: { name: 'Product Owner', color: 'bg-amber-500', canComplete: ['documentation', 'planning'], isLeader: false },
  
  leader_creativity: { name: 'Líder Creatividad', color: 'bg-pink-600', canComplete: ['ux_ui', 'content'], isLeader: true },
  creativity: { name: 'Creatividad', color: 'bg-pink-500', canComplete: ['ux_ui', 'content'], isLeader: false },
  
  leader_marketing: { name: 'Líder Marketing', color: 'bg-indigo-600', canComplete: ['marketing'], isLeader: true },
  marketing: { name: 'Marketing', color: 'bg-indigo-500', canComplete: ['marketing'], isLeader: false },
  
  leader_paid: { name: 'Líder Paid', color: 'bg-violet-600', canComplete: ['paid'], isLeader: true },
  paid: { name: 'Paid', color: 'bg-violet-500', canComplete: ['paid'], isLeader: false },
  
  leader_social: { name: 'Líder Social Media', color: 'bg-sky-600', canComplete: ['social'], isLeader: true },
  social: { name: 'Social Media', color: 'bg-sky-500', canComplete: ['social'], isLeader: false },
  
  leader_seo: { name: 'Líder SEO', color: 'bg-green-600', canComplete: ['seo_accessibility'], isLeader: true },
  seo: { name: 'SEO', color: 'bg-green-500', canComplete: ['seo_accessibility'], isLeader: false },
  
  leader_software: { name: 'Líder Software', color: 'bg-purple-600', canComplete: ['technical', 'development', 'performance', 'security'], isLeader: true },
  software: { name: 'Software', color: 'bg-purple-500', canComplete: ['technical', 'development', 'performance', 'security'], isLeader: false },
  
  qa: { name: 'QA', color: 'bg-red-500', canComplete: ['qa', 'responsive'], isLeader: false }
};

// Plantilla base de checklist items
export const CHECKLIST_TEMPLATE = [
  // 1. BRIEF DEL PROYECTO - Líder Producto / Product Owner
  { phase: 'documentation', title: 'Objetivos de negocio y generalidades del proyecto', weight: 'critical', order: 1, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'documentation', title: 'Contexto y Antecedentes del proyecto', weight: 'critical', order: 2, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'documentation', title: 'Entregables: Listado táctico de qué se va a recibir', weight: 'critical', order: 3, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'documentation', title: 'Hoja de vida del proyecto cargada', weight: 'critical', order: 4, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'documentation', title: 'Insumos base recopilados y organizados', weight: 'high', order: 5, technologies: ['all'], siteTypes: ['all'] },
  
  // 2. EQUIPO Y CRONOGRAMA - Líder Producto / Product Owner
  { phase: 'planning', title: 'Equipo y roles: Quién aprueba, quién ejecuta por área', weight: 'critical', order: 1, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'planning', title: 'Clientes y stakeholders identificados', weight: 'critical', order: 2, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'planning', title: 'Cronograma del proyecto definido', weight: 'critical', order: 3, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'planning', title: 'Canal único de comunicación definido', weight: 'high', order: 4, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'planning', title: 'Repositorio centralizado de insumos', weight: 'high', order: 5, technologies: ['all'], siteTypes: ['all'] },
  
  // 3. CREATIVIDAD - BRAND Y LOOK & FEEL - Líder Creatividad / Creatividad
  { phase: 'ux_ui', title: 'Brand Guidelines: Manual de marca, logos y tipografías', weight: 'critical', order: 1, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'ux_ui', title: 'Look & Feel / Referencias visuales definidas', weight: 'critical', order: 2, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'ux_ui', title: 'Diseño responsive (mobile, tablet, desktop)', weight: 'critical', order: 3, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'ux_ui', title: 'Estados especiales diseñados (error, hover, success)', weight: 'high', order: 4, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'ux_ui', title: 'Prototipo del diseño disponible', weight: 'high', order: 5, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'ux_ui', title: 'Referentes para animaciones especificados', weight: 'medium', order: 6, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'ux_ui', title: 'Check de revisión de accesibilidad completado', weight: 'high', order: 7, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'ux_ui', title: 'Visualización de textos extensos contemplada', weight: 'medium', order: 8, technologies: ['all'], siteTypes: ['all'] },
  
  // 4. CREATIVIDAD - COPY Y CONTENIDO - Líder Creatividad / Creatividad
  { phase: 'content', title: 'Tono de Voz: ¿Cómo habla el proyecto?', weight: 'critical', order: 1, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'content', title: 'Copy base: Textos mínimos obligatorios', weight: 'critical', order: 2, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'content', title: 'Textos finales aprobados por cliente', weight: 'critical', order: 3, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'content', title: 'Idioma(s) definidos', weight: 'high', order: 4, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'content', title: 'Assets multimedia cargados y organizados', weight: 'critical', order: 5, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'content', title: 'Imágenes optimizadas para web', weight: 'high', order: 6, technologies: ['all'], siteTypes: ['all'] },
  
  // 5. SOFTWARE - STACK Y REQUERIMIENTOS - Líder Software / Software
  { phase: 'technical', title: 'Stack tecnológico: Lenguaje o plataforma definida', weight: 'critical', order: 1, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'technical', title: 'Requerimientos funcionales: Casos de uso documentados', weight: 'critical', order: 2, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'technical', title: 'Accesos y credenciales: Servidores, GitHub/Bitbucket, APIs', weight: 'critical', order: 3, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'technical', title: 'Entornos: Dev, Staging y Producción definidos', weight: 'critical', order: 4, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'technical', title: 'Criterios de aceptación: Cuándo una tarea está lista', weight: 'high', order: 5, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'technical', title: 'Diseño mobile y desktop disponible', weight: 'critical', order: 6, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'technical', title: 'Prototipo del diseño verificado', weight: 'high', order: 7, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'technical', title: 'Visualización de textos extensos contemplada', weight: 'medium', order: 8, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'technical', title: 'Referentes de animaciones claros', weight: 'medium', order: 9, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'technical', title: 'Check de accesibilidad del diseño realizado', weight: 'high', order: 10, technologies: ['all'], siteTypes: ['all'] },
  
  // 6. SOFTWARE - DESARROLLO - Líder Software / Software
  { phase: 'development', title: 'Código limpio y comentado', weight: 'high', order: 1, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'development', title: 'Componentes reutilizables implementados', weight: 'medium', order: 2, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'development', title: 'Validaciones de formularios', weight: 'critical', order: 3, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'development', title: 'Manejo de errores implementado', weight: 'high', order: 4, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'development', title: 'Funcionalidades testeadas internamente', weight: 'high', order: 5, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'development', title: 'Ambiente de producción: Dominio final', weight: 'critical', order: 6, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'development', title: 'Certificados SSL configurados', weight: 'critical', order: 7, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'development', title: 'Accesos al servidor de producción', weight: 'critical', order: 8, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'development', title: 'Credenciales de producción de herramientas', weight: 'critical', order: 9, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'development', title: 'Backups configurados (ambiente y BD)', weight: 'high', order: 10, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'development', title: 'Docker de producción configurado', weight: 'high', order: 11, technologies: ['custom'], siteTypes: ['all'] },
  { phase: 'development', title: 'SEO y Analytics: Tags y Scripts implementados', weight: 'critical', order: 12, technologies: ['all'], siteTypes: ['all'] },
  
  // 7. SOFTWARE - PERFORMANCE - Líder Software / Software
  { phase: 'performance', title: 'Imágenes optimizadas', weight: 'critical', order: 1, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'performance', title: 'Lazy loading implementado', weight: 'high', order: 2, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'performance', title: 'Core Web Vitals > 90', weight: 'critical', order: 3, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'performance', title: 'CSS/JS minificado', weight: 'high', order: 4, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'performance', title: 'Caché configurado', weight: 'high', order: 5, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'performance', title: 'CDN implementado', weight: 'medium', order: 6, technologies: ['all'], siteTypes: ['all'] },
  
  // 8. SEO - KEYWORDS Y ARQUITECTURA - Líder SEO / SEO
  { phase: 'seo_accessibility', title: 'Keyword research inicial: Palabras clave principales', weight: 'critical', order: 1, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'seo_accessibility', title: 'Arquitectura de información: Mapa de navegación', weight: 'critical', order: 2, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'seo_accessibility', title: 'Estructura de URLs definida', weight: 'high', order: 3, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'seo_accessibility', title: 'Herramientas de medición: Google Search Console', weight: 'critical', order: 4, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'seo_accessibility', title: 'Acceso a Google Analytics (GA4)', weight: 'critical', order: 5, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'seo_accessibility', title: 'Benchmarking SEO: Competencia identificada', weight: 'high', order: 6, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'seo_accessibility', title: 'Redirecciones: Listado de URLs antiguas (migración)', weight: 'critical', order: 7, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'seo_accessibility', title: 'Meta tags configurados', weight: 'high', order: 8, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'seo_accessibility', title: 'Alt text en imágenes', weight: 'high', order: 9, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'seo_accessibility', title: 'Sitemap XML generado', weight: 'medium', order: 10, technologies: ['all'], siteTypes: ['all'] },
  
  // 9. QA - RESPONSIVE - QA
  { phase: 'responsive', title: 'Mobile first implementado', weight: 'critical', order: 1, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'responsive', title: 'Breakpoints testeados (mobile, tablet, desktop)', weight: 'critical', order: 2, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'responsive', title: 'Touch targets adecuados', weight: 'high', order: 3, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'responsive', title: 'Imágenes responsive', weight: 'high', order: 4, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'responsive', title: 'Menú mobile funcional', weight: 'critical', order: 5, technologies: ['all'], siteTypes: ['all'] },
  
  // 10. QA - TESTING - QA
  { phase: 'qa', title: 'Cross-browser testing completado', weight: 'high', order: 1, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'qa', title: 'Links verificados (no rotos)', weight: 'high', order: 2, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'qa', title: 'Formularios testeados end-to-end', weight: 'critical', order: 3, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'qa', title: 'Flujo de compra verificado', weight: 'critical', order: 4, technologies: ['all'], siteTypes: ['ecommerce'] },
  { phase: 'qa', title: 'Contenido revisado (ortografía y gramática)', weight: 'medium', order: 5, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'qa', title: 'Conversiones trackeadas correctamente', weight: 'high', order: 6, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'qa', title: 'Accesibilidad – Contraste de colores WCAG', weight: 'high', order: 7, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'qa', title: 'Accesibilidad – Navegación por teclado', weight: 'medium', order: 8, technologies: ['all'], siteTypes: ['all'] },
  
  // 11. SOFTWARE - SEGURIDAD - Líder Software / Software
  { phase: 'security', title: 'SSL/HTTPS activo', weight: 'critical', order: 1, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'security', title: 'Protección contra spam implementada', weight: 'high', order: 2, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'security', title: 'Backups configurados', weight: 'high', order: 3, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'security', title: 'Datos sensibles protegidos', weight: 'critical', order: 4, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'security', title: 'Actualizaciones de seguridad aplicadas', weight: 'high', order: 5, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'security', title: 'Pasarela de pago segura', weight: 'critical', order: 6, technologies: ['all'], siteTypes: ['ecommerce'] },
  
  // 12. ENTREGA FINAL
  { phase: 'delivery', title: 'Documentación entregada', weight: 'high', order: 1, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'delivery', title: 'Capacitación realizada', weight: 'medium', order: 2, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'delivery', title: 'Credenciales entregadas', weight: 'high', order: 3, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'delivery', title: 'Plan de mantenimiento acordado', weight: 'medium', order: 4, technologies: ['all'], siteTypes: ['all'] },
  { phase: 'delivery', title: 'Aprobación final del cliente', weight: 'critical', order: 5, technologies: ['all'], siteTypes: ['all'] }
];

// Función para generar checklist filtrado
export function generateFilteredChecklist(siteType, technology) {
  const criticalPhases = SITE_TYPE_CONFIG[siteType]?.criticalPhases || [];
  
  return CHECKLIST_TEMPLATE.filter(item => {
    const techMatch = item.technologies.includes('all') || item.technologies.includes(technology);
    const siteMatch = item.siteTypes.includes('all') || item.siteTypes.includes(siteType);
    return techMatch && siteMatch;
  }).map(item => {
    // Aumentar peso si la fase es crítica para este tipo de sitio
    let adjustedWeight = item.weight;
    if (criticalPhases.includes(item.phase)) {
      if (item.weight === 'medium') adjustedWeight = 'high';
      if (item.weight === 'high') adjustedWeight = 'critical';
    }
    return { ...item, weight: adjustedWeight };
  });
}

// Función para calcular riesgo del proyecto
export function calculateProjectRisk(items, project) {
  const total = items.length;
  const completed = items.filter(i => i.status === 'completed').length;
  const criticalPending = items.filter(i => i.weight === 'critical' && i.status !== 'completed').length;
  const highPending = items.filter(i => i.weight === 'high' && i.status !== 'completed').length;
  const conflicts = items.filter(i => i.status === 'conflict').length;
  
  const completionRate = total > 0 ? (completed / total) * 100 : 0;
  
  let riskLevel = 'low';
  let reasons = [];
  let recommendations = [];
  
  if (criticalPending > 0) {
    riskLevel = 'high';
    reasons.push(`${criticalPending} ítem(s) crítico(s) pendiente(s)`);
    recommendations.push('Completar todos los ítems críticos antes de entregar');
  }
  
  if (conflicts > 0) {
    riskLevel = riskLevel === 'low' ? 'medium' : 'high';
    reasons.push(`${conflicts} conflicto(s) sin resolver`);
    recommendations.push('Resolver conflictos con el líder web');
  }
  
  if (highPending > 3) {
    riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
    reasons.push(`${highPending} ítems de alta prioridad pendientes`);
    recommendations.push('Priorizar ítems de alta importancia');
  }
  
  if (completionRate < 50) {
    riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
    reasons.push(`Solo ${completionRate.toFixed(0)}% completado`);
    recommendations.push('Acelerar progreso del proyecto');
  }
  
  // Verificar fecha de entrega
  if (project?.target_date) {
    const daysRemaining = Math.ceil((new Date(project.target_date) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysRemaining < 0) {
      riskLevel = 'high';
      reasons.push('Fecha de entrega vencida');
      recommendations.push('Renegociar fecha de entrega');
    } else if (daysRemaining < 3 && completionRate < 80) {
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
      reasons.push(`Solo ${daysRemaining} días restantes`);
      recommendations.push('Enfocar esfuerzos en ítems críticos');
    }
  }
  
  if (reasons.length === 0) {
    reasons.push('Proyecto en buen estado');
    recommendations.push('Continuar con el plan actual');
  }
  
  return {
    level: riskLevel,
    completionRate,
    criticalPending,
    highPending,
    conflicts,
    reasons,
    recommendations,
    canDeliver: criticalPending === 0 && conflicts === 0
  };
}