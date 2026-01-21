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

export default function ChecklistItemRow({ item, onUpdate, onEdit, userRole, dragHandleProps, isDragging }) {
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
      flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-all group
      ${isCompleted ? 'bg-green-500/10' : 'bg-[var(--bg-primary)]'}
      ${isConflict ? 'bg-orange-500/10 border border-orange-500/40' : ''}
      ${isNotApplicable ? 'opacity-60' : ''}
      ${isDragging ? 'shadow-lg opacity-80' : ''}
      hover:bg-[var(--bg-hover)]
    `}>
      <div
        {...dragHandleProps}
        className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">

        <GripVertical className="h-5 w-5 text-[var(--text-tertiary)] mt-0.5" />
      </div>
      
      <Checkbox
        checked={isCompleted}
        onCheckedChange={handleStatusChange}
        disabled={isNotApplicable}
        className="mt-1 flex-shrink-0" />

      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-sm font-medium text-\nflex justify-between">
              {item.title}
            </p>
            {item.description &&
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{item.description}</p>
            }
            
            {/* Metadatos de completado */}
            {isCompleted && item.completed_by &&
            <div className="flex items-center gap-2 mt-2 text-xs text-[var(--text-tertiary)]">
                <User className="h-3 w-3" />
                <span>{item.completed_by}</span>
                {roleConfig &&
              <Badge variant="outline" className={`text-xs ${roleConfig.color} bg-opacity-10`}>
                    {roleConfig.name}
                  </Badge>
              }
                {item.completed_at &&
              <>
                    <Clock className="h-3 w-3 ml-2" />
                    <span>{format(new Date(item.completed_at), "d MMM, HH:mm", { locale: es })}</span>
                  </>
              }
              </div>
            }
            
            {/* Indicador de conflicto */}
            {isConflict &&
            <div className="flex items-center gap-2 mt-2 text-xs text-orange-600">
                <AlertTriangle className="h-3 w-3" />
                <span>Conflicto detectado - Escalado al líder web</span>
              </div>
            }
            
            {/* Notas */}
            {showNotes ?
            <div className="mt-2 space-y-2">
                <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Agregar notas o comentarios..."
                className="text-xs h-20" />

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setShowNotes(false)}>
                    <X className="h-3 w-3 mr-1" /> Cancelar
                  </Button>
                  <Button size="sm" onClick={handleSaveNotes}>
                    <Check className="h-3 w-3 mr-1" /> Guardar
                  </Button>
                </div>
              </div> :
            item.notes &&
            <p className="text-xs text-[var(--text-secondary)] mt-2 italic bg-[var(--bg-tertiary)] p-2 rounded">
                💬 {item.notes}
              </p>
            }
          </div>
          
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
            <Badge className={`${weightConfig.color} border-0 text-xs whitespace-nowrap`}>
              {weightConfig.label}
            </Badge>
            
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onEdit(item)}>

                      <Edit className="h-3 w-3 sm:h-4 sm:w-4 text-[var(--text-tertiary)]" />
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
                      onClick={() => setShowNotes(!showNotes)}>

                      <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-[var(--text-tertiary)]" />
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
                      onClick={handleMarkNotApplicable}>

                      <X className="h-3 w-3 sm:h-4 sm:w-4 text-[var(--text-tertiary)]" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Marcar como N/A</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
    </div>);

}