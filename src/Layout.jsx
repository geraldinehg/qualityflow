import React from 'react';
import Sidebar from './components/navigation/Sidebar';
import UserProfileMenu from './components/navigation/UserProfileMenu';
import LoginScreen from './components/auth/LoginScreen';
import { base44 } from '@/api/base44Client';

export default function Layout({ children, currentPageName }) {
  const [currentSection, setCurrentSection] = React.useState('dashboard');
  const [sidebarAction, setSidebarAction] = React.useState(null);
  const [user, setUser] = React.useState(undefined);
  const [theme, setTheme] = React.useState(() => localStorage.getItem('theme') || 'light');
  
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const u = await base44.auth.me();
          setUser(u);
          
          // Configurar juan@antpack.co como administrador automáticamente
          if (u.email === 'juan@antpack.co') {
            try {
              const members = await base44.entities.TeamMember.filter({ user_email: u.email });
              if (members.length === 0) {
                await base44.entities.TeamMember.create({
                  user_email: u.email,
                  display_name: u.full_name || 'Juan',
                  role: 'administrador',
                  is_active: true
                });
              } else if (members[0].role !== 'administrador') {
                await base44.entities.TeamMember.update(members[0].id, { role: 'administrador' });
              }
            } catch (error) {
              console.error('Error setting admin role:', error);
            }
          } else {
            // Notificar nuevo usuario si no tiene TeamMember
            try {
              const members = await base44.entities.TeamMember.filter({ user_email: u.email });
              if (members.length === 0) {
                await base44.functions.invoke('notifyNewUser', {
                  userEmail: u.email,
                  userName: u.full_name
                });
              }
            } catch (error) {
              console.error('Error checking user:', error);
            }
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      }
    };
    loadUser();
  }, []);
  
  // Páginas públicas que no requieren autenticación
  const isPublicPage = currentPageName === 'PublicTaskForm';
  
  // Mostrar pantalla de login si no hay usuario (excepto páginas públicas)
  if (user === null && !isPublicPage) {
    return <LoginScreen />;
  }
  
  // Mostrar loading mientras verificamos autenticación (excepto páginas públicas)
  if (user === undefined && !isPublicPage) {
    return null;
  }
  
  // Si es página pública, renderizar directamente sin layout
  if (isPublicPage) {
    return <div className="min-h-screen bg-[var(--bg-primary)]">{children}</div>;
  }
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Si estamos en una página específica (no Dashboard), no mostrar el layout de navegación
  const isProjectPage = currentPageName === 'ProjectChecklist';
  
  if (isProjectPage) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <style>{`
          :root {
            --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
            --primary-magenta: #FF1B7E;
          }
          
          /* Light Mode (default) */
          [data-theme="light"] {
            --bg-primary: #fafafa;
            --bg-secondary: #ffffff;
            --bg-tertiary: #f5f5f5;
            --bg-hover: #f8f8f8;
            --text-primary: #171717;
            --text-secondary: #525252;
            --text-tertiary: #737373;
            --border-primary: #e5e5e5;
            --border-secondary: #d4d4d4;
            --shadow: rgba(0, 0, 0, 0.1);
            --particle-opacity: 0.12;
            --particle-color: #1a1a1a;
          }

          /* Dark Mode */
          [data-theme="dark"] {
            --bg-primary: #0a0a0a;
            --bg-secondary: #171717;
            --bg-tertiary: #262626;
            --bg-hover: #1f1f1f;
            --text-primary: #fafafa;
            --text-secondary: #a3a3a3;
            --text-tertiary: #737373;
            --border-primary: #262626;
            --border-secondary: #404040;
            --shadow: rgba(0, 0, 0, 0.3);
            --particle-opacity: 0.2;
            --particle-color: white;
          }

          /* Fallback sin tema definido */
          :root:not([data-theme]) {
            --bg-primary: #fafafa;
            --bg-secondary: #ffffff;
            --bg-tertiary: #f5f5f5;
            --bg-hover: #f8f8f8;
            --text-primary: #171717;
            --text-secondary: #525252;
            --text-tertiary: #737373;
            --border-primary: #e5e5e5;
            --border-secondary: #d4d4d4;
            --shadow: rgba(0, 0, 0, 0.1);
            --particle-opacity: 0.12;
            --particle-color: #1a1a1a;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            background: var(--bg-primary);
            color: var(--text-primary);
            transition: background 0.2s ease, color 0.2s ease;
          }
          
          ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          ::-webkit-scrollbar-track {
            background: var(--bg-secondary);
          }
          ::-webkit-scrollbar-thumb {
            background: #FF1B7E;
            border-radius: 3px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #e6156e;
          }
          
          * {
            transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .particle-bg {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            opacity: var(--particle-opacity);
            background-image: 
              radial-gradient(2px 2px at 20% 30%, var(--particle-color), transparent),
              radial-gradient(2px 2px at 60% 70%, var(--particle-color), transparent),
              radial-gradient(1px 1px at 50% 50%, var(--particle-color), transparent),
              radial-gradient(1px 1px at 80% 10%, var(--particle-color), transparent),
              radial-gradient(1px 1px at 90% 60%, var(--particle-color), transparent);
            background-size: 200% 200%;
            animation: particle-drift 20s ease-in-out infinite;
          }
          
          @keyframes particle-drift {
            0%, 100% { background-position: 0% 0%; }
            50% { background-position: 100% 100%; }
          }
        `}</style>
        <div className="particle-bg" />
        {children}
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <style>{`
        :root {
          --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
          --primary-magenta: #FF1B7E;
        }
        
        /* Dark Mode */
        [data-theme="dark"] {
          --bg-primary: #0a0a0a;
          --bg-secondary: #1a1a1a;
          --bg-tertiary: #2a2a2a;
          --bg-hover: rgba(42, 42, 42, 0.5);
          --text-primary: #ffffff;
          --text-secondary: #a1a1aa;
          --text-tertiary: #71717a;
          --border-primary: #2a2a2a;
          --border-secondary: #3f3f46;
          --shadow: rgba(0, 0, 0, 0.5);
          --particle-opacity: 0.3;
          --particle-color: white;
        }
        
        /* Light Mode */
        [data-theme="light"] {
          --bg-primary: #f8f9fa;
          --bg-secondary: #ffffff;
          --bg-tertiary: #f1f3f5;
          --bg-hover: rgba(241, 243, 245, 0.8);
          --text-primary: #1a1a1a;
          --text-secondary: #52525b;
          --text-tertiary: #71717a;
          --border-primary: #e5e7eb;
          --border-secondary: #d1d5db;
          --shadow: rgba(0, 0, 0, 0.1);
          --particle-opacity: 0.15;
          --particle-color: #1a1a1a;
        }
        
        body {
          font-family: var(--font-sans);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          background: var(--bg-primary);
          color: var(--text-primary);
          transition: background 0.3s ease, color 0.3s ease;
        }
        
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: var(--bg-secondary);
        }
        ::-webkit-scrollbar-thumb {
          background: #FF1B7E;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #e6156e;
        }
        
        * {
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .particle-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          opacity: var(--particle-opacity);
          background-image: 
            radial-gradient(2px 2px at 20% 30%, var(--particle-color), transparent),
            radial-gradient(2px 2px at 60% 70%, var(--particle-color), transparent),
            radial-gradient(1px 1px at 50% 50%, var(--particle-color), transparent),
            radial-gradient(1px 1px at 80% 10%, var(--particle-color), transparent),
            radial-gradient(1px 1px at 90% 60%, var(--particle-color), transparent);
          background-size: 200% 200%;
          animation: particle-drift 20s ease-in-out infinite;
        }
        
        @keyframes particle-drift {
          0%, 100% { background-position: 0% 0%; }
          50% { background-position: 100% 100%; }
        }
      `}</style>
      <div className="particle-bg" />
      
      <div className="flex min-h-screen">
        <Sidebar 
          currentSection={currentSection} 
          onSectionChange={setCurrentSection}
          onAction={setSidebarAction}
        />

        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <header className="bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] sticky top-0 z-10 backdrop-blur-sm bg-opacity-95">
            <div className="flex items-center justify-end px-6 py-3.5 gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-all duration-200 active:scale-95"
                title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              >
                {theme === 'dark' ? (
                  <svg className="w-5 h-5 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              <UserProfileMenu />
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto">
            {React.cloneElement(children, { 
              currentSection, 
              onSectionChange: setCurrentSection,
              sidebarAction,
              onActionHandled: () => setSidebarAction(null),
              currentUser: user
            })}
          </main>
        </div>
      </div>
    </div>
  );
}