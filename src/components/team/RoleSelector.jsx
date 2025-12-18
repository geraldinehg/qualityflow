import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { User, Code, CheckSquare, Crown, Briefcase } from 'lucide-react';
import { ROLE_CONFIG } from '../checklist/checklistTemplates';

const roleIcons = {
  developer: Code,
  qa: CheckSquare,
  web_leader: Crown,
  product_owner: Briefcase
};

export default function RoleSelector({ value, onChange, showLabel = true }) {
  const selectedConfig = value ? ROLE_CONFIG[value] : null;
  const Icon = value ? roleIcons[value] : User;
  
  return (
    <div className="flex items-center gap-2">
      {showLabel && <span className="text-sm text-slate-500">Tu rol:</span>}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Selecciona tu rol">
            {selectedConfig && (
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span>{selectedConfig.name}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(ROLE_CONFIG).map(([key, config]) => {
            const RoleIcon = roleIcons[key];
            return (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  <RoleIcon className="h-4 w-4" />
                  <span>{config.name}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {selectedConfig && (
        <Badge className={`${selectedConfig.color} text-white border-0`}>
          Activo
        </Badge>
      )}
    </div>
  );
}