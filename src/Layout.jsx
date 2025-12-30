import React from 'react';
import Sidebar from './components/navigation/Sidebar';
import UserProfileMenu from './components/navigation/UserProfileMenu';
import LoginScreen from './components/auth/LoginScreen';
import { base44 } from '@/api/base44Client';

export default function Layout({ children, currentPageName }) {
  const [currentSection, setCurrentSection] = React.useState('dashboard');
  const [sidebarAction, setSidebarAction] = React.useState(null);
  const [user, setUser] = React.useState(undefined);
  
  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const u = await base44.auth.me();
          setUser(u);
          
          // Notificar nuevo usuario si no tiene TeamMember
          try {
            const members = await base44.entities.TeamMember.filter({ user_email: u.email });
            if (members.length === 0) {
              // Usuario nuevo, enviar notificación
              await base44.functions.invoke('notifyNewUser', {
                userEmail: u.email,
                userName: u.full_name
              });
            }
          } catch (error) {
            console.error('Error checking user:', error);
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
  
  // Mostrar pantalla de login si no hay usuario
  if (user === null) {
    return <LoginScreen />;
  }
  
  // Mostrar loading mientras verificamos autenticación
  if (user === undefined) {
    return null;
  }
  
  // Si estamos en una página específica (no Dashboard), no mostrar el layout de navegación
  const isProjectPage = currentPageName === 'ProjectChecklist';
  
  if (isProjectPage) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <style>{`
          :root {
            --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
            --primary-magenta: #FF1B7E;
            --dark-bg: #0a0a0a;
            --card-bg: #1a1a1a;
            --border-color: #2a2a2a;
          }
          body {
            font-family: var(--font-sans);
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            background: #0a0a0a;
            color: #ffffff;
          }
          ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          ::-webkit-scrollbar-track {
            background: #1a1a1a;
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
            opacity: 0.3;
            background-image: 
              radial-gradient(2px 2px at 20% 30%, white, transparent),
              radial-gradient(2px 2px at 60% 70%, white, transparent),
              radial-gradient(1px 1px at 50% 50%, white, transparent),
              radial-gradient(1px 1px at 80% 10%, white, transparent),
              radial-gradient(1px 1px at 90% 60%, white, transparent);
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
    <div className="min-h-screen bg-[#0a0a0a]">
      <style>{`
        :root {
          --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
          --primary-magenta: #FF1B7E;
          --dark-bg: #0a0a0a;
          --card-bg: #1a1a1a;
          --border-color: #2a2a2a;
        }
        body {
          font-family: var(--font-sans);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          background: #0a0a0a;
          color: #ffffff;
        }
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #1a1a1a;
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
          opacity: 0.3;
          background-image: 
            radial-gradient(2px 2px at 20% 30%, white, transparent),
            radial-gradient(2px 2px at 60% 70%, white, transparent),
            radial-gradient(1px 1px at 50% 50%, white, transparent),
            radial-gradient(1px 1px at 80% 10%, white, transparent),
            radial-gradient(1px 1px at 90% 60%, white, transparent);
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
          <header className="bg-[#1a1a1a] border-b border-[#2a2a2a] sticky top-0 z-10">
            <div className="flex items-center justify-end px-6 py-3">
              <UserProfileMenu />
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-8 overflow-auto">
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