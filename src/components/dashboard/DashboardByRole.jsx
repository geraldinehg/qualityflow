import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminDashboard from './roles/AdminDashboard';
import LeaderDashboard from './roles/LeaderDashboard';
import OperationalDashboard from './roles/OperationalDashboard';
import QADashboard from './roles/QADashboard';

export default function DashboardByRole({ user, teamMember, onSectionChange }) {
  // Validación de datos antes de renderizar
  if (!user || !teamMember) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF1B7E] mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const role = teamMember.role;

  // Admin/Administrador
  if (role === 'administrador') {
    return <AdminDashboard user={user} onSectionChange={onSectionChange} />;
  }

  // Líderes de área
  const leaderRoles = [
    'leader_web',
    'leader_product',
    'leader_ux',
    'leader_ui',
    'leader_seo',
    'leader_paid',
    'leader_marketing',
    'leader_software',
    'leader_dev_web'
  ];
  
  if (leaderRoles.includes(role)) {
    return <LeaderDashboard user={user} teamMember={teamMember} onSectionChange={onSectionChange} />;
  }

  // QA especializado
  if (role === 'qa') {
    return <QADashboard user={user} onSectionChange={onSectionChange} />;
  }

  // Roles operativos
  const operationalRoles = [
    'ux', 'ui', 'seo', 'paid_media', 'marketing', 
    'developer', 'web_dev', 'product_owner'
  ];
  
  if (operationalRoles.includes(role)) {
    return <OperationalDashboard user={user} teamMember={teamMember} onSectionChange={onSectionChange} />;
  }

  // Fallback: vista operativa por defecto
  return <OperationalDashboard user={user} teamMember={teamMember} onSectionChange={onSectionChange} />;
}