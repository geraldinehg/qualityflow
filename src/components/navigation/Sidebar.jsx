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
  Shield,
  Lock } from
'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import AdminPanel from '../admin/AdminPanel';

import { Palette, Code, Search, TrendingUp, DollarSign, Share2 } from 'lucide-react';

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
    label: 'Por Área',
    icon: Tag,
    hasSubMenu: true,
    subItems: [
    { id: 'area-creativity', label: 'Creatividad', section: 'area-creativity' },
    { id: 'area-software', label: 'Software', section: 'area-software' },
    { id: 'area-seo', label: 'SEO', section: 'area-seo' },
    { id: 'area-marketing', label: 'Marketing', section: 'area-marketing' },
    { id: 'area-paid', label: 'Paid Media', section: 'area-paid' },
    { id: 'area-social', label: 'Social Media', section: 'area-social' }]

  }]

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
  label: 'Cronogramas',
  icon: Calendar,
  page: 'Dashboard',
  section: 'schedules',
  subMenu: [
    {
      id: 'global-schedules',
      label: 'Cronograma Global',
      icon: Calendar,
      section: 'global-schedules'
    }
  ]
},
{
  id: 'reports',
  label: 'Reportes',
  icon: BarChart3,
  page: 'Dashboard',
  section: 'reports'
},
{
  id: 'global-access',
  label: 'Accesos Globales',
  icon: Lock,
  page: 'GlobalAccess',
  section: 'global-access',
  requiresAdmin: true
}];


export default function Sidebar({ currentSection, onSectionChange, onAction }) {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState({});
  const [expandedSubMenus, setExpandedSubMenus] = useState({});
  const [currentUser, setCurrentUser] = React.useState(null);
  const [showAdminPanel, setShowAdminPanel] = React.useState(false);
  const [canViewAccess, setCanViewAccess] = React.useState(false);

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        // Verificar si el usuario puede ver accesos globales
        const members = await base44.entities.TeamMember.filter({ user_email: user.email });
        const member = members[0];
        const canView = user.role === 'admin' || member?.role === 'administrador' || member?.role === 'software' || member?.role === 'web_leader';
        setCanViewAccess(canView);
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    loadUser();
  }, []);

  const toggleMenu = (itemId) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const toggleSubMenu = (itemId) => {
    setExpandedSubMenus((prev) => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  return (
    <div className="w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-[var(--border-primary)]">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-[#FF1B7E] to-[#e6156e] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF1B7E]/20">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          Antpack
        </h1>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-1">
        {MENU_ITEMS.map((item) => {
          // Filtrar items que requieren admin
          if (item.requiresAdmin && !canViewAccess) {
            return null;
          }

          const Icon = item.icon;
          const isActive = item.section ? currentSection === item.section : currentSection === 'dashboard';
          const isExpanded = expandedMenus[item.id];
          const hasSubMenu = item.subMenu && item.subMenu.length > 0;

          return (
            <div key={item.id}>
              <Link
                to={item.page ? createPageUrl(item.page) : '#'}
                onClick={(e) => {
                  if (!item.page) e.preventDefault();
                  if (hasSubMenu) {
                    toggleMenu(item.id);
                  }
                  if (item.section) {
                    onSectionChange(item.section || 'dashboard');
                  }
                }}
                className={cn(
                  "w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive ?
                  "bg-[#FF1B7E] text-white shadow-md shadow-[#FF1B7E]/25" :
                  "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                )}>

                <div className="flex items-center gap-3 text-left">
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-xs font-normal text-left group-hover:text-[#FF1B7E] transition-colors duration-200 line-clamp-2" style={{ fontStyle: 'normal !important', fontFamily: 'Satoshi, sans-serif' }}>{item.label}</span>
                </div>
                {hasSubMenu && (
                isExpanded ?
                <ChevronDown className="h-4 w-4" /> :
                <ChevronRight className="h-4 w-4" />)
                }
              </Link>
              
              {/* Submenu */}
              {hasSubMenu && isExpanded &&
              <div className="ml-4 mt-1 space-y-1 border-l-2 border-[var(--border-primary)] pl-2">
                  {item.subMenu.map((subItem) => {
                  const SubIcon = subItem.icon;
                  const isSubActive = subItem.section && currentSection === subItem.section;
                  const isSubExpanded = expandedSubMenus[subItem.id];
                  const hasNestedMenu = subItem.hasSubMenu && subItem.subItems;

                  return (
                    <div key={subItem.id}>
                        <button
                        onClick={() => {
                          if (hasNestedMenu) {
                            toggleSubMenu(subItem.id);
                          } else if (subItem.action) {
                            onAction?.(subItem.action);
                          } else if (subItem.section) {
                            onSectionChange(subItem.section);
                          }
                        }}
                        className={cn(
                          "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                          isSubActive ?
                          "bg-[#FF1B7E]/15 text-[#FF1B7E] font-medium" :
                          "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                        )}>

                          <div className="flex items-center gap-2">
                            <SubIcon className="h-4 w-4" />
                            <span className="font-sans" style={{ fontStyle: 'normal !important', fontFamily: 'Satoshi, -apple-system, BlinkMacSystemFont, sans-serif' }}>{subItem.label}</span>
                          </div>
                          {hasNestedMenu && (
                        isSubExpanded ?
                        <ChevronDown className="h-3 w-3" /> :
                        <ChevronRight className="h-3 w-3" />)
                        }
                        </button>
                        
                        {/* Nested submenu */}
                        {hasNestedMenu && isSubExpanded &&
                      <div className="ml-4 mt-1 space-y-1 border-l-2 border-[var(--border-primary)] pl-2">
                            {subItem.subItems.map((nestedItem) => {
                          const isNestedActive = nestedItem.section && currentSection === nestedItem.section;

                          return (
                            <button
                              key={nestedItem.id}
                              onClick={() => {
                                if (nestedItem.section) {
                                  onSectionChange(nestedItem.section);
                                }
                              }}
                              className={cn(
                                "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all text-left",
                                isNestedActive ?
                                "bg-[#FF1B7E]/20 text-[#FF1B7E]" :
                                "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                              )}>

                                  <span className="font-sans" style={{ fontStyle: 'normal !important', fontFamily: 'Satoshi, -apple-system, BlinkMacSystemFont, sans-serif' }}>{nestedItem.label}</span>
                                </button>);

                        })}
                          </div>
                      }
                      </div>);

                })}
                </div>
              }
            </div>);

        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--border-primary)] space-y-2">
        <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all duration-200">
          <Settings className="h-5 w-5" />
          <span className="text-sm font-normal text-left group-hover:text-[#FF1B7E] transition-colors duration-200 line-clamp-2" style={{ fontStyle: 'normal !important', fontFamily: 'Satoshi, -apple-system, BlinkMacSystemFont, sans-serif' }}>Configuración</span>
        </button>
        
        {/* Admin Panel - Solo para administradores */}
        {currentUser && (currentUser.role === 'admin' || currentUser.email === 'luis.restrepo@antpack.co' || currentUser.email === 'geraldine.hurtado@antpack.co') &&
        <button
          onClick={() => setShowAdminPanel(true)}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-[#FF1B7E] to-[#e6156e] text-white shadow-md hover:shadow-lg hover:shadow-[#FF1B7E]/30 transition-all duration-200 active:scale-[0.98]">

            <Shield className="h-5 w-5" />
            <span className="text-sm font-normal text-left group-hover:text-[#FF1B7E] transition-colors duration-200 line-clamp-2" style={{ fontStyle: 'normal !important', fontFamily: 'Satoshi, -apple-system, BlinkMacSystemFont, sans-serif' }}>Panel Admin</span>
          </button>
        }
      </div>
      
      <AdminPanel isOpen={showAdminPanel} onClose={() => setShowAdminPanel(false)} />
    </div>);

}