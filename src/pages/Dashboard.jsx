import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, LayoutGrid, List, Filter, AlertTriangle, CheckCircle2, Clock, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProjectCard from '../components/project/ProjectCard';
import CreateProjectModal from '../components/project/CreateProjectModal';
import EditProjectModal from '../components/project/EditProjectModal';
import AdminPanel from '../components/admin/AdminPanel';
import RoleSelector from '../components/team/RoleSelector';
import ResourceOccupancy from '../components/resources/ResourceOccupancy';
import GeneralSchedules from '../components/schedule/GeneralSchedules';
import DashboardHome from '../components/dashboard/DashboardHome';

export default function Dashboard({ currentSection = 'dashboard', onSectionChange, sidebarAction, onActionHandled }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userRole, setUserRole] = useState(() => localStorage.getItem('userRole') || '');
  const [user, setUser] = useState(null);
  
  const queryClient = useQueryClient();
  
  // Handle sidebar actions
  useEffect(() => {
    if (sidebarAction === 'create-project') {
      setIsCreateOpen(true);
      onActionHandled?.();
    }
  }, [sidebarAction, onActionHandled]);
  
  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
      } catch (error) {
        // Si el usuario no está autenticado, redirigir al login
        if (error.message?.includes('not authenticated')) {
          window.location.href = createPageUrl('Login');
        }
      }
    };
    loadUser();
  }, []);
  
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
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsCreateOpen(false);
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
  
  // Vista de Categorías
  if (currentSection === 'categories') {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Gestión de Categorías</h2>
        </div>
        <AdminPanel isOpen={true} onClose={() => onSectionChange('projects')} defaultTab="technologies" />
      </div>
    );
  }

  // Vista de Cronogramas
  if (currentSection === 'schedules') {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Cronogramas Generales</h2>
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
          <h2 className="text-2xl font-bold text-white">Ocupación de Recursos</h2>
        </div>
        <ResourceOccupancy />
      </div>
    );
  }

  // Vista de Proyectos
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Gestión de Proyectos</h2>
        <div className="flex items-center gap-3">
          <RoleSelector value={userRole} onChange={setUserRole} />
          {user?.role === 'admin' && (
            <Button onClick={() => setShowAdminPanel(true)} className="bg-[#1a1a1a] border border-[#2a2a2a] hover:bg-[#2a2a2a] text-white">
              <Settings className="h-4 w-4 mr-2" />
              Admin
            </Button>
          )}
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
            className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] hover:border-[#FF1B7E]/30 transition-all"
            whileHover={{ y: -4, scale: 1.02 }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#2a2a2a] rounded-lg">
                <LayoutGrid className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{stats.total}</p>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Total proyectos</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] hover:border-[#FF1B7E]/30 transition-all"
            whileHover={{ y: -4, scale: 1.02 }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#FF1B7E]/10 rounded-lg">
                <Clock className="h-5 w-5 text-[#FF1B7E]" />
              </div>
              <div>
                <p className="text-3xl font-bold text-[#FF1B7E]">{stats.inProgress}</p>
                <p className="text-xs text-gray-400 uppercase tracking-wider">En progreso</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] hover:border-red-500/30 transition-all"
            whileHover={{ y: -4, scale: 1.02 }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-red-500">{stats.blocked}</p>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Con alertas</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] hover:border-green-500/30 transition-all"
            whileHover={{ y: -4, scale: 1.02 }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-green-500">{stats.completed}</p>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Completados</p>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Filters */}
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar proyectos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#FF1B7E] focus:ring-[#FF1B7E]/20"
              />
            </div>
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList className="bg-[#0a0a0a] border-[#2a2a2a]">
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
              <div key={i} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl h-64 animate-pulse" />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <LayoutGrid className="h-10 w-10 text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {searchQuery || statusFilter !== 'all' ? 'No se encontraron proyectos' : 'Sin proyectos'}
            </h3>
            <p className="text-gray-400 mb-6">
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
      
      <AdminPanel
        isOpen={showAdminPanel}
        onClose={() => setShowAdminPanel(false)}
      />
    </div>
  );
}