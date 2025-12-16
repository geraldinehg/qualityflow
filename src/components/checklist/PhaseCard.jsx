import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronRight, FileText, GitBranch, Palette, Code, Zap, Search, Smartphone, CheckSquare, Shield, Rocket, Plus, Edit2, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChecklistItemRow from './ChecklistItemRow';
import { PHASES } from './checklistTemplates';

const iconMap = {
  FileText, GitBranch, Palette, Code, Zap, Search, Smartphone, CheckSquare, Shield, Rocket
};

export default function PhaseCard({ 
  phase, 
  items, 
  isExpanded, 
  onToggle, 
  onItemUpdate,
  onItemEdit,
  onAddItem,
  onEditPhase,
  userRole,
  isCriticalPhase,
  customPhaseName,
  dragHandleProps
}) {
  const phaseConfig = PHASES[phase];
  const Icon = iconMap[phaseConfig?.icon] || FileText;
  const displayName = customPhaseName || phaseConfig?.name || phase;
  
  const completed = items.filter(i => i.status === 'completed').length;
  const total = items.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;
  const hasCritical = items.some(i => i.weight === 'critical' && i.status !== 'completed');
  const hasConflicts = items.some(i => i.status === 'conflict');
  
  return (
    <Card className={`overflow-hidden transition-all duration-300 ${isCriticalPhase ? 'ring-2 ring-amber-200' : ''}`}>
      <CardHeader 
        className="hover:bg-slate-50 transition-colors py-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="h-5 w-5 text-slate-400" />
            </div>
            <div 
              className={`p-2 rounded-lg ${isCriticalPhase ? 'bg-amber-100' : 'bg-slate-100'} cursor-pointer`}
              onClick={onToggle}
            >
              <Icon className={`h-5 w-5 ${isCriticalPhase ? 'text-amber-600' : 'text-slate-600'}`} />
            </div>
            <div className="cursor-pointer" onClick={onToggle}>
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                {displayName}
                {isCriticalPhase && (
                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                    Crítico para este proyecto
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-slate-500 mt-0.5">
                {completed} de {total} completados
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onEditPhase(phase);
              }}
            >
              <Edit2 className="h-4 w-4 text-slate-400" />
            </Button>
            {hasCritical && (
              <Badge className="bg-red-100 text-red-700 border-0">
                Críticos pendientes
              </Badge>
            )}
            {hasConflicts && (
              <Badge className="bg-orange-100 text-orange-700 border-0">
                Conflictos
              </Badge>
            )}
            <div className="w-24">
              <Progress value={progress} className="h-2" />
            </div>
            <span className="text-sm font-medium text-slate-600 w-12">
              {progress.toFixed(0)}%
            </span>
            <div className="cursor-pointer" onClick={onToggle}>
              {isExpanded ? (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-slate-400" />
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="pt-0 pb-4">
              <Droppable droppableId={phase} type="ITEM">
                {(provided) => (
                  <div 
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="border-t pt-4 space-y-1"
                  >
                    {items.sort((a, b) => a.order - b.order).map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={snapshot.isDragging ? 'opacity-50' : ''}
                          >
                            <ChecklistItemRow 
                              item={item} 
                              onUpdate={onItemUpdate}
                              onEdit={onItemEdit}
                              userRole={userRole}
                              dragHandleProps={provided.dragHandleProps}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
              
              {/* Botón para agregar nuevo ítem */}
              <div className="mt-3 pt-3 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-slate-600 hover:text-slate-900 hover:border-slate-400"
                  onClick={() => onAddItem(phase)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar ítem a esta fase
                </Button>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}