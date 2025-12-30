import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Users, 
  Calendar,
  Settings,
  UserCircle,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Plus,
  Tag,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import AdminPanel from '../admin/AdminPanel';

const MENU_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    page: 'Dashboard'
  },
  {
    id: 'projects',
    label: 'Proyectos',
    icon: FolderKanban,
    page: 'Dashboard',
    section: 'projects',
    subMenu: [
      {
        id: 'new-project',
        label: 'Nuevo Proyecto',
        icon: Plus,
        action: 'create-project'
      },
      {
        id: 'categories',
        label: 'Categorías',
        icon: Tag,
        section: 'categories'
      }
    ]
  },
  {
    id: 'resources',
    label: 'Ocupación de Recursos',
    icon: Users,
    page: 'Dashboard',
    section: 'resources'
  },
  {
    id: 'schedules',
    label: 'Cronogramas Generales',
    icon: Calendar,
    page: 'Dashboard',
    section: 'schedules'
  },
  {
    id: 'team',
    label: 'Gestión de Equipo',
    icon: UserCircle,
    page: 'Dashboard',
    admin: true
  },
  {
    id: 'reports',
    label: 'Reportes',
    icon: BarChart3,
    page: 'Dashboard',
    section: 'reports'
  }
];

export default function Sidebar({ currentSection, onSectionChange, onAction }) {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState({});
  const [currentUser, setCurrentUser] = React.useState(null);
  const [showAdminPanel, setShowAdminPanel] = React.useState(false);
  
  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    loadUser();
  }, []);
  
  const toggleMenu = (itemId) => {
    setExpandedMenus(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };
  
  return (
    <div className="w-64 bg-[#1a1a1a] border-r border-[#2a2a2a] min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-[#2a2a2a]">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <div className="w-8 h-8 bg-[#FF1B7E] rounded-lg flex items-center justify-center">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          Control QA
        </h1>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-1">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.section ? currentSection === item.section : currentSection === 'dashboard';
          const isExpanded = expandedMenus[item.id];
          const hasSubMenu = item.subMenu && item.subMenu.length > 0;
          
          return (
            <div key={item.id}>
              <button
                onClick={() => {
                  if (hasSubMenu) {
                    toggleMenu(item.id);
                  }
                  onSectionChange(item.section || 'dashboard');
                }}
                className={cn(
                  "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                  isActive 
                    ? "bg-[#FF1B7E] text-white shadow-lg shadow-[#FF1B7E]/20" 
                    : "text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </div>
                {hasSubMenu && (
                  isExpanded ? 
                    <ChevronDown className="h-4 w-4" /> : 
                    <ChevronRight className="h-4 w-4" />
                )}
              </button>
              
              {/* Submenu */}
              {hasSubMenu && isExpanded && (
                <div className="ml-4 mt-1 space-y-1 border-l-2 border-[#2a2a2a] pl-2">
                  {item.subMenu.map((subItem) => {
                    const SubIcon = subItem.icon;
                    const isSubActive = subItem.section && currentSection === subItem.section;
                    
                    return (
                      <button
                        key={subItem.id}
                        onClick={() => {
                          if (subItem.action) {
                            onAction?.(subItem.action);
                          } else if (subItem.section) {
                            onSectionChange(subItem.section);
                          }
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                          isSubActive
                            ? "bg-[#FF1B7E]/20 text-[#FF1B7E]"
                            : "text-gray-500 hover:text-white hover:bg-[#2a2a2a]"
                        )}
                      >
                        <SubIcon className="h-4 w-4" />
                        <span>{subItem.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#2a2a2a] space-y-2">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-[#2a2a2a] transition-all">
          <Settings className="h-5 w-5" />
          <span>Configuración</span>
        </button>
        
        {/* Admin Panel - Solo para administradores */}
        {currentUser && (currentUser.role === 'admin' || currentUser.email === 'luis.restrepo@antpack.co' || currentUser.email === 'geraldine.hurtado@antpack.co') && (
          <button
            onClick={() => setShowAdminPanel(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium bg-[#2a2a2a] text-white hover:bg-[#FF1B7E] hover:shadow-lg hover:shadow-[#FF1B7E]/20 transition-all"
          >
            <Shield className="h-5 w-5" />
            <span>Panel Admin</span>
          </button>
        )}
      </div>
      
      <AdminPanel isOpen={showAdminPanel} onClose={() => setShowAdminPanel(false)} />
    </div>
  );
}