import React, { useState } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, MessageSquare, User, Clock, X, Check, Edit, GripVertical } from 'lucide-react';
import { WEIGHT_CONFIG, ROLE_CONFIG } from './checklistTemplates';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ChecklistItemRow({ item, onUpdate, onEdit, userRole, dragHandleProps }) {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(item.notes || '');
  
  const weightConfig = WEIGHT_CONFIG[item.weight];
  const isCompleted = item.status === 'completed';
  const isConflict = item.status === 'conflict';
  const isNotApplicable = item.status === 'not_applicable';
  
  const handleStatusChange = (checked) => {
    if (checked) {
      onUpdate(item.id, { 
        status: 'completed',
        completed_at: new Date().toISOString()
      });
    } else {
      onUpdate(item.id, { 
        status: 'pending',
        completed_at: null,
        completed_by: null,
        completed_by_role: null
      });
    }
  };
  
  const handleMarkNotApplicable = () => {
    onUpdate(item.id, { 
      status: isNotApplicable ? 'pending' : 'not_applicable'
    });
  };
  
  const handleSaveNotes = () => {
    onUpdate(item.id, { notes });
    setShowNotes(false);
  };
  
  const roleConfig = item.completed_by_role ? ROLE_CONFIG[item.completed_by_role] : null;
  
  return (
    <div className={`
      flex items-start gap-3 p-3 rounded-lg transition-all
      ${isCompleted ? 'bg-green-50/50' : ''}
      ${isConflict ? 'bg-orange-50 border border-orange-200' : ''}
      ${isNotApplicable ? 'bg-slate-50 opacity-60' : ''}
      hover:bg-slate-50
    `}>
      <Checkbox
        checked={isCompleted}
        onCheckedChange={handleStatusChange}
        disabled={isNotApplicable}
        className="mt-1"
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className={`text-sm font-medium ${isCompleted ? 'line-through text-slate-400' : 'text-slate-700'} ${isNotApplicable ? 'line-through' : ''}`}>
              {item.title}
            </p>
            {item.description && (
              <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
            )}
            
            {/* Metadatos de completado */}
            {isCompleted && item.completed_by && (
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                <User className="h-3 w-3" />
                <span>{item.completed_by}</span>
                {roleConfig && (
                  <Badge variant="outline" className={`text-xs ${roleConfig.color} bg-opacity-10`}>
                    {roleConfig.name}
                  </Badge>
                )}
                {item.completed_at && (
                  <>
                    <Clock className="h-3 w-3 ml-2" />
                    <span>{format(new Date(item.completed_at), "d MMM, HH:mm", { locale: es })}</span>
                  </>
                )}
              </div>
            )}
            
            {/* Indicador de conflicto */}
            {isConflict && (
              <div className="flex items-center gap-2 mt-2 text-xs text-orange-600">
                <AlertTriangle className="h-3 w-3" />
                <span>Conflicto detectado - Escalado al líder web</span>
              </div>
            )}
            
            {/* Notas */}
            {showNotes ? (
              <div className="mt-2 space-y-2">
                <Textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Agregar notas o comentarios..."
                  className="text-xs h-20"
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setShowNotes(false)}>
                    <X className="h-3 w-3 mr-1" /> Cancelar
                  </Button>
                  <Button size="sm" onClick={handleSaveNotes}>
                    <Check className="h-3 w-3 mr-1" /> Guardar
                  </Button>
                </div>
              </div>
            ) : item.notes && (
              <p className="text-xs text-slate-500 mt-2 italic bg-slate-100 p-2 rounded">
                💬 {item.notes}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge className={`${weightConfig.color} border-0 text-xs`}>
              {weightConfig.label}
            </Badge>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7"
                    onClick={() => onEdit(item)}
                  >
                    <Edit className="h-4 w-4 text-slate-400" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Editar ítem</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7"
                    onClick={() => setShowNotes(!showNotes)}
                  >
                    <MessageSquare className="h-4 w-4 text-slate-400" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Agregar nota</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-7 w-7 ${isNotApplicable ? 'bg-slate-200' : ''}`}
                    onClick={handleMarkNotApplicable}
                  >
                    <X className="h-4 w-4 text-slate-400" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Marcar como N/A</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  );
}