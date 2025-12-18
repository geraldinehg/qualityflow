import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Calendar, Users, ArrowRight, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { SITE_TYPE_CONFIG, TECHNOLOGY_CONFIG } from '../checklist/checklistTemplates';
import { motion } from 'framer-motion';

const STATUS_CONFIG = {
  draft: { label: 'Borrador', color: 'bg-slate-100 text-slate-700' },
  in_progress: { label: 'En Progreso', color: 'bg-blue-100 text-blue-700' },
  review: { label: 'En Revisión', color: 'bg-purple-100 text-purple-700' },
  blocked: { label: 'Bloqueado', color: 'bg-red-100 text-red-700' },
  completed: { label: 'Completado', color: 'bg-green-100 text-green-700' }
};

const RISK_CONFIG = {
  low: { color: 'bg-green-500', icon: CheckCircle2 },
  medium: { color: 'bg-amber-500', icon: AlertTriangle },
  high: { color: 'bg-red-500', icon: AlertTriangle }
};

export default function ProjectCard({ project, index }) {
  const siteTypeConfig = SITE_TYPE_CONFIG[project.site_type];
  const techConfig = TECHNOLOGY_CONFIG[project.technology];
  const statusConfig = STATUS_CONFIG[project.status];
  const riskConfig = project.risk_level ? RISK_CONFIG[project.risk_level] : null;
  
  const daysRemaining = project.target_date 
    ? Math.ceil((new Date(project.target_date) - new Date()) / (1000 * 60 * 60 * 24))
    : null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="hover:shadow-lg transition-all duration-300 group h-full flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${techConfig?.color || 'bg-slate-400'}`} />
                <span className="text-xs text-slate-500 uppercase tracking-wide">
                  {techConfig?.name || project.technology}
                </span>
              </div>
              <CardTitle className="text-lg font-semibold group-hover:text-blue-600 transition-colors">
                {project.name}
              </CardTitle>
            </div>
            <Badge className={`${statusConfig.color} border-0`}>
              {statusConfig.label}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 flex-1 flex flex-col">
          <div className="h-10">
            {project.description && (
              <p className="text-sm text-slate-600 line-clamp-2">{project.description}</p>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              {siteTypeConfig?.name || project.site_type}
            </Badge>
            {project.has_conflicts && (
              <Badge className="bg-orange-100 text-orange-700 border-0 text-xs">
                Conflictos
              </Badge>
            )}
            {project.critical_pending > 0 && (
              <Badge className="bg-red-100 text-red-700 border-0 text-xs">
                {project.critical_pending} críticos
              </Badge>
            )}
          </div>
          
          {/* Progreso */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-500">Progreso</span>
              <span className="font-medium">{project.completion_percentage?.toFixed(0) || 0}%</span>
            </div>
            <Progress value={project.completion_percentage || 0} className="h-2" />
          </div>
          
          {/* Fechas y equipo */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <div className="flex items-center gap-4">
              {project.target_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(project.target_date), "d MMM", { locale: es })}</span>
                  {daysRemaining !== null && (
                    <Badge 
                      variant="outline" 
                      className={`ml-1 text-xs ${daysRemaining < 0 ? 'text-red-600 border-red-200' : daysRemaining < 3 ? 'text-amber-600 border-amber-200' : ''}`}
                    >
                      {daysRemaining < 0 ? `${Math.abs(daysRemaining)}d vencido` : `${daysRemaining}d`}
                    </Badge>
                  )}
                </div>
              )}
              {project.team_members?.length > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{project.team_members.length}</span>
                </div>
              )}
            </div>
            
            {riskConfig && (
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${riskConfig.color}`} />
                <span className="capitalize">{project.risk_level}</span>
              </div>
            )}
          </div>
          
          <div className="mt-auto pt-4">
            <Link to={createPageUrl(`ProjectChecklist?id=${project.id}`)}>
              <Button className="w-full group-hover:bg-blue-600 transition-colors">
                Ver Checklist
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}