import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { format, parse, isValid } from 'date-fns';

const AREA_MAP = {
  'creatividad': 'creativity',
  'creativity': 'creativity',
  'software': 'software',
  'desarrollo': 'software',
  'seo': 'seo',
  'marketing': 'marketing',
  'paid': 'paid',
  'paid media': 'paid',
  'social': 'social',
  'social media': 'social',
  'producto': 'product',
  'product': 'product',
  'qa': 'qa',
  'testing': 'qa'
};

export default function ExcelImportButton({ projectId, existingTasks = [], onImportComplete }) {
  const fileInputRef = useRef(null);
  const [isImporting, setIsImporting] = React.useState(false);

  const parseDate = (dateValue) => {
    if (!dateValue) return null;
    
    // Si es un número (fecha de Excel)
    if (typeof dateValue === 'number') {
      const date = new Date((dateValue - 25569) * 86400 * 1000);
      return format(date, 'yyyy-MM-dd');
    }
    
    // Si es string, intentar parsear varios formatos
    if (typeof dateValue === 'string') {
      const formats = ['dd/MM/yyyy', 'dd-MM-yyyy', 'yyyy-MM-dd', 'MM/dd/yyyy'];
      for (const fmt of formats) {
        try {
          const parsed = parse(dateValue, fmt, new Date());
          if (isValid(parsed)) {
            return format(parsed, 'yyyy-MM-dd');
          }
        } catch (e) {
          continue;
        }
      }
    }
    
    return null;
  };

  const normalizeArea = (areaValue) => {
    if (!areaValue) return null;
    const normalized = areaValue.toString().toLowerCase().trim();
    return AREA_MAP[normalized] || null;
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        toast.error('El archivo Excel está vacío o no tiene datos');
        setIsImporting(false);
        return;
      }

      // Detectar columnas automáticamente
      const headers = jsonData[0].map(h => h?.toString().toLowerCase().trim());
      const tareaIdx = headers.findIndex(h => h?.includes('tarea') || h?.includes('nombre') || h?.includes('task'));
      const areaIdx = headers.findIndex(h => h?.includes('area') || h?.includes('área'));
      const asignadoIdx = headers.findIndex(h => h?.includes('asignado') || h?.includes('responsable') || h?.includes('assigned'));
      const inicioIdx = headers.findIndex(h => h?.includes('inicio') || h?.includes('start') || h?.includes('fecha inicio'));
      const finIdx = headers.findIndex(h => h?.includes('fin') || h?.includes('end') || h?.includes('fecha fin'));
      const duracionIdx = headers.findIndex(h => h?.includes('duración') || h?.includes('duracion') || h?.includes('días') || h?.includes('dias') || h?.includes('duration'));

      if (tareaIdx === -1) {
        toast.error('No se encontró la columna "Tarea" en el Excel');
        setIsImporting(false);
        return;
      }

      const tasksToImport = [];
      const errors = [];

      // Procesar cada fila (saltar header)
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        
        const taskName = row[tareaIdx]?.toString().trim();
        if (!taskName) continue; // Saltar filas vacías

        const area = areaIdx !== -1 ? normalizeArea(row[areaIdx]) : null;
        const assignedTo = asignadoIdx !== -1 ? row[asignadoIdx]?.toString().trim() : null;
        const startDate = inicioIdx !== -1 ? parseDate(row[inicioIdx]) : null;
        const endDate = finIdx !== -1 ? parseDate(row[finIdx]) : null;
        const duration = duracionIdx !== -1 ? parseInt(row[duracionIdx]) : null;

        if (!startDate) {
          errors.push(`Fila ${i + 1}: "${taskName}" - falta fecha de inicio`);
          continue;
        }

        if (!area) {
          errors.push(`Fila ${i + 1}: "${taskName}" - área no válida o faltante`);
          continue;
        }

        // Calcular duración si falta
        let finalDuration = duration;
        let finalEndDate = endDate;

        if (!finalDuration && endDate && startDate) {
          const daysDiff = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
          finalDuration = daysDiff > 0 ? daysDiff : 1;
        } else if (!finalDuration) {
          finalDuration = 1; // Default
        }

        if (!finalEndDate && startDate && finalDuration) {
          const start = new Date(startDate);
          const end = new Date(start);
          end.setDate(end.getDate() + finalDuration - 1);
          finalEndDate = format(end, 'yyyy-MM-dd');
        }

        tasksToImport.push({
          name: taskName,
          area,
          assigned_to: assignedTo || '',
          start_date: startDate,
          end_date: finalEndDate,
          duration: finalDuration,
          project_id: projectId,
          status: 'pending'
        });
      }

      if (tasksToImport.length === 0) {
        toast.error('No se encontraron tareas válidas para importar');
        if (errors.length > 0) {
          console.error('Errores:', errors);
        }
        setIsImporting(false);
        return;
      }

      // Mostrar errores si los hay
      if (errors.length > 0) {
        toast.warning(`${errors.length} fila(s) con errores fueron omitidas. Ver consola para detalles.`);
        console.warn('Errores de importación:', errors);
      }

      // Llamar callback con las tareas
      await onImportComplete(tasksToImport);
      
      toast.success(`${tasksToImport.length} tarea(s) importadas correctamente`);
      
    } catch (error) {
      console.error('Error importing Excel:', error);
      toast.error('Error al importar el archivo Excel');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileUpload}
        className="hidden"
      />
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={isImporting}
      >
        {isImporting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Importando...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Importar Excel
          </>
        )}
      </Button>
    </>
  );
}