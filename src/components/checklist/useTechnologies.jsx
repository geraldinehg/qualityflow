import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TECHNOLOGY_CONFIG } from './checklistTemplates';

export function useTechnologies() {
  const { data: customTechnologies = [] } = useQuery({
    queryKey: ['custom-technologies'],
    queryFn: () => base44.entities.Technology.filter({ is_active: true }),
    initialData: []
  });
  
  // Combinar tecnologías predeterminadas con personalizadas
  const allTechnologies = {
    ...TECHNOLOGY_CONFIG,
    ...customTechnologies.reduce((acc, tech) => {
      acc[tech.key] = {
        name: tech.name,
        color: tech.color
      };
      return acc;
    }, {})
  };
  
  return allTechnologies;
}