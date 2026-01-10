import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, LayoutGrid, List, Filter, AlertTriangle, CheckCircle2, Clock, FolderKanban } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ProjectCard from '../components/project/ProjectCard';
import CreateProjectModal from '../components/project/CreateProjectModal';
import EditProjectModal from '../components/project/EditProjectModal';
import RoleSelector from '../components/team/RoleSelector';
import ResourceOccupancy from '../components/resources/ResourceOccupancy';
import GeneralSchedules from '../components/schedule/GeneralSchedules';
import DashboardHome from '../components/dashboard/DashboardHome';
import AdminPanel from '../components/admin/AdminPanel';


export default function Dashboard({ currentSection = 'dashboard', onSectionChange, sidebarAction, onActionHandled, currentUser }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userRole, setUserRole] = useState(() => localStorage.getItem('userRole') || '');
  
  const queryClient = useQueryClient();
  const user = currentUser;
  
  // Handle sidebar actions
  useEffect(() => {
    if (sidebarAction === 'create-project') {
      setIsCreateOpen(true);
      onActionHandled?.();
    }
  }, [sidebarAction, onActionHandled]);
  
  useEffect(() => {
    if (userRole) {
      localStorage.setItem('userRole', userRole);
    }
  }, [userRole]);
  
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date')
  });
  
  const [editingProject, setEditingProject] = useState(null);
  
  const createMutation = useMutation({
    mutationFn: async (data) => {
      // 1. Crear el proyecto
      const newProject = await base44.entities.Project.create(data);
      
      // 2. Crear automáticamente configuración de tareas para este proyecto
      const { data: globalConfigs } = await queryClient.fetchQuery({
        queryKey: ['task-configurations'],
        queryFn: async () => {
          const allConfigs = await base44.entities.TaskConfiguration.list('-created_date');
          return (allConfigs || []).filter(c => !c.project_id);
        }
      });
      
      const globalConfig = globalConfigs?.[0];
      
      // Crear config del proyecto basada en la global o default
      const projectConfig = {
        project_id: newProject.id,
        module_enabled: true,
        custom_statuses: [
          { key: 'todo', label: 'Por hacer', color: 'gray', is_final: false, order: 0 },
          { key: 'in_progress', label: 'En progreso', color: 'blue', is_final: false, order: 1 },
          { key: 'completed', label: 'Finalizado', color: 'green', is_final: true, order: 2 }
        ],
        custom_priorities: [
          { key: 'low', label: 'Baja', color: 'gray', order: 0 },
          { key: 'medium', label: 'Media', color: 'yellow', order: 1 },
          { key: 'high', label: 'Alta', color: 'red', order: 2 }
        ],
        custom_fields: []
      };
      
      console.log('🔧 Creando configuración de tareas para proyecto:', newProject.id, projectConfig);
      const createdConfig = await base44.entities.TaskConfiguration.create(projectConfig);
      console.log('✅ Configuración creada:', createdConfig);
      
      return newProject;
    },
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['task-configuration', newProject.id] });
      setIsCreateOpen(false);
      toast.success('✅ Proyecto creado con configuración de tareas');
    }
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Project.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setEditingProject(null);
    }
  });
  
  const duplicateMutation = useMutation({
    mutationFn: async (project) => {
      const { id, created_date, updated_date, created_by, completion_percentage, critical_pending, risk_level, has_conflicts, ...projectData } = project;
      const newProject = await base44.entities.Project.create({
        ...projectData,
        name: `${project.name} (Copia)`,
        status: 'draft',
        completion_percentage: 0,
        critical_pending: 0
      });
      
      // Duplicar checklist items
      const items = await base44.entities.ChecklistItem.filter({ project_id: project.id });
      if (items.length > 0) {
        const newItems = items.map(({ id, created_date, updated_date, created_by, project_id, completed_by, completed_at, completed_by_role, status, ...itemData }) => ({
          ...itemData,
          project_id: newProject.id,
          status: 'pending'
        }));
        await base44.entities.ChecklistItem.bulkCreate(newItems);
      }
      
      return newProject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (projectId) => {
      // Eliminar checklist items primero
      const items = await base44.entities.ChecklistItem.filter({ project_id: projectId });
      for (const item of items) {
        await base44.entities.ChecklistItem.delete(item.id);
      }
      
      // Eliminar conflictos
      const conflicts = await base44.entities.Conflict.filter({ project_id: projectId });
      for (const conflict of conflicts) {
        await base44.entities.Conflict.delete(conflict.id);
      }
      
      // Eliminar proyecto
      await base44.entities.Project.delete(projectId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setEditingProject(null);
    }
  });
  
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  
  const stats = {
    total: projects.length,
    inProgress: projects.filter(p => p.status === 'in_progress').length,
    blocked: projects.filter(p => p.status === 'blocked' || p.has_conflicts).length,
    completed: projects.filter(p => p.status === 'completed').length
  };
  
  // Home Dashboard
  if (currentSection === 'dashboard') {
    return <DashboardHome onNavigate={onSectionChange} />;
  }
  
  // Vista de Proyectos por Área
  if (currentSection?.startsWith('area-')) {
    const areaKey = currentSection.replace('area-', '');
    const areaNames = {
      'creativity': 'Creatividad',
      'software': 'Software',
      'seo': 'SEO',
      'marketing': 'Marketing',
      'paid': 'Paid Media',
      'social': 'Social Media'
    };
    
    const areaProjects = projects.filter(p => p.applicable_areas?.includes(areaKey));
    
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
            Proyectos de {areaNames[areaKey]}
          </h2>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl h-64 animate-pulse" />
            ))}
          </div>
        ) : areaProjects.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <FolderKanban className="h-10 w-10 text-[var(--text-tertiary)]" />
            </div>
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              No hay proyectos en {areaNames[areaKey]}
            </h3>
            <p className="text-[var(--text-secondary)] mb-6">
              Los proyectos con esta área aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {areaProjects.map((project, index) => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  index={index}
                  onEdit={setEditingProject}
                  onDuplicate={(p) => duplicateMutation.mutate(p)}
                  onDelete={(p) => {
                    if (confirm('¿Estás seguro de eliminar este proyecto? Esta acción no se puede deshacer.')) {
                      deleteMutation.mutate(p.id);
                    }
                  }}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    );
  }

  // Vista de Cronogramas
  if (currentSection === 'schedules') {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">Cronogramas Generales</h2>
        </div>
        <GeneralSchedules />
      </div>
    );
  }

  // Vista de Ocupación de Recursos
  if (currentSection === 'resources') {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">Ocupación de Recursos</h2>
        </div>
        <ResourceOccupancy />
      </div>
    );
  }

  // Vista de Proyectos
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <RoleSelector value={userRole} onChange={setUserRole} />
          <Button onClick={() => setIsCreateOpen(true)} className="bg-[#FF1B7E] hover:bg-[#e6156e] text-white shadow-lg shadow-[#FF1B7E]/20">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Proyecto
          </Button>
        </div>
      </div>
      
      <div>
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div 
            className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-primary)] hover:border-[#FF1B7E]/30 transition-all"
            whileHover={{ y: -4, scale: 1.02 }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--bg-tertiary)] rounded-lg">
                <LayoutGrid className="h-5 w-5 text-[var(--text-secondary)]" />
              </div>
              <div>
                <p className="text-3xl font-bold text-[var(--text-primary)]">{stats.total}</p>
                <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Total proyectos</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-primary)] hover:border-[#FF1B7E]/30 transition-all"
            whileHover={{ y: -4, scale: 1.02 }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#FF1B7E]/10 rounded-lg">
                <Clock className="h-5 w-5 text-[#FF1B7E]" />
              </div>
              <div>
                <p className="text-3xl font-bold text-[#FF1B7E]">{stats.inProgress}</p>
                <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">En progreso</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-primary)] hover:border-red-500/30 transition-all"
            whileHover={{ y: -4, scale: 1.02 }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-red-500">{stats.blocked}</p>
                <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Con alertas</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-primary)] hover:border-green-500/30 transition-all"
            whileHover={{ y: -4, scale: 1.02 }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-green-500">{stats.completed}</p>
                <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Completados</p>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Filters */}
        <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-primary)] mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
              <Input
                placeholder="Buscar proyectos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[#FF1B7E] focus:ring-[var(--ring)]"
              />
            </div>
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList className="bg-[var(--bg-primary)] border-[var(--border-primary)]">
                <TabsTrigger value="all" className="data-[state=active]:bg-[#FF1B7E] data-[state=active]:text-white">Todos</TabsTrigger>
                <TabsTrigger value="in_progress" className="data-[state=active]:bg-[#FF1B7E] data-[state=active]:text-white">En Progreso</TabsTrigger>
                <TabsTrigger value="review" className="data-[state=active]:bg-[#FF1B7E] data-[state=active]:text-white">En Revisión</TabsTrigger>
                <TabsTrigger value="blocked" className="data-[state=active]:bg-[#FF1B7E] data-[state=active]:text-white">Bloqueados</TabsTrigger>
                <TabsTrigger value="completed" className="data-[state=active]:bg-[#FF1B7E] data-[state=active]:text-white">Completados</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl h-64 animate-pulse" />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <LayoutGrid className="h-10 w-10 text-[var(--text-tertiary)]" />
            </div>
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              {searchQuery || statusFilter !== 'all' ? 'No se encontraron proyectos' : 'Sin proyectos'}
            </h3>
            <p className="text-[var(--text-secondary)] mb-6">
              {searchQuery || statusFilter !== 'all' 
                ? 'Intenta con otros filtros de búsqueda' 
                : 'Crea tu primer proyecto para comenzar'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Button onClick={() => setIsCreateOpen(true)} className="bg-[#FF1B7E] hover:bg-[#e6156e] text-white shadow-lg shadow-[#FF1B7E]/20">
                <Plus className="h-4 w-4 mr-2" />
                Crear Proyecto
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredProjects.map((project, index) => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  index={index}
                  onEdit={setEditingProject}
                  onDuplicate={(p) => duplicateMutation.mutate(p)}
                  onDelete={(p) => {
                    if (confirm('¿Estás seguro de eliminar este proyecto? Esta acción no se puede deshacer.')) {
                      deleteMutation.mutate(p.id);
                    }
                  }}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      
      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />
      
      {editingProject && (
        <EditProjectModal
          isOpen={!!editingProject}
          onClose={() => setEditingProject(null)}
          onSave={(data) => updateMutation.mutate({ id: editingProject.id, data })}
          onDelete={(id) => {
            if (confirm('¿Estás seguro de eliminar este proyecto? Esta acción no se puede deshacer.')) {
              deleteMutation.mutate(id);
            }
          }}
          project={editingProject}
          isLoading={updateMutation.isPending || deleteMutation.isPending}
        />
      )}
      
      </div>
      );
      }