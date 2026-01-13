/**
 * DayView Component - Vista de Día estilo Excel para el Calendario
 * 
 * Muestra una tabla con:
 * - Columnas: Caballos
 * - Filas: Horarios (cada 30 minutos)
 * - Celdas: Nombre del alumno asignado
 * 
 * INSTRUCCIONES:
 * 1. Copia este archivo a tu proyecto: src/components/calendar/DayView.tsx
 * 2. Ajusta los imports según la ubicación de tus componentes UI
 * 3. Ajusta los tipos Clase, Caballo, Alumno, Instructor según tu api.ts
 */

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Clock, User, UserCheck, Landmark, CalendarDays, Download, Filter } from "lucide-react";

// ============================================
// TIPOS - Ajusta estos según tu archivo api.ts
// ============================================
interface Clase {
  id: number;
  especialidad: "ADIESTRAMIENTO" | "EQUINOTERAPIA" | "EQUIITACION";
  dia: string; // formato: "yyyy-MM-dd"
  hora: string; // formato: "HH:mm:ss" o "HH:mm"
  estado: "PROGRAMADA" | "EN_CURSO" | "COMPLETADA" | "CANCELADA" | "ACA" | "ASA";
  observaciones?: string;
  alumnoId: number;
  instructorId: number;
  caballoId: number;
}

interface Caballo {
  id: number;
  nombre: string;
  tipoCaballo: "ESCUELA" | "PRIVADO";
  disponible: boolean;
  alumnoId?: number;
}

interface Alumno {
  id: number;
  nombre: string;
  apellido: string;
}

interface Instructor {
  id: number;
  nombre: string;
  apellido: string;
}

// ============================================
// PROPS DEL COMPONENTE
// ============================================
interface DayViewProps {
  selectedDate: Date;
  clases: Clase[];
  caballos: Caballo[];
  alumnos: Alumno[];
  instructores: Instructor[];
  onStatusChange: (claseId: number, newStatus: Clase["estado"]) => void;
  onCellClick?: (caballo: Caballo, hora: string) => void;
}

// ============================================
// CONFIGURACIÓN - Ajusta según tus necesidades
// ============================================

// Horarios de 9:00 a 18:30 cada 30 minutos
const TIME_SLOTS = [
  "09:00", "09:30",
  "10:00", "10:30",
  "11:00", "11:30",
  "12:00", "12:30",
  "13:00", "13:30",
  "14:00", "14:30",
  "15:00", "15:30",
  "16:00", "16:30",
  "17:00", "17:30",
  "18:00", "18:30",
];

// Estilos por estado
const estadoColors: Record<string, string> = {
  PROGRAMADA: "bg-warning/20 text-warning border-warning/40 hover:bg-warning/30",
  EN_CURSO: "bg-info/20 text-info border-info/40 hover:bg-info/30",
  COMPLETADA: "bg-success/20 text-success border-success/40 hover:bg-success/30",
  CANCELADA: "bg-destructive/20 text-destructive border-destructive/40 hover:bg-destructive/30",
  ACA: "bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700",
  ASA: "bg-cyan-100 text-cyan-700 border-cyan-300 hover:bg-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-700",
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export function DayView({
  selectedDate,
  clases,
  caballos,
  alumnos,
  instructores,
  onStatusChange,
  onCellClick,
}: DayViewProps) {
  // Estado para filtro por instructor
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>("all");

  // Formatear fecha a yyyy-MM-dd
  const dateKey = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(selectedDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, [selectedDate]);

  // Filtrar clases del día seleccionado y por instructor
  const clasesDelDia = useMemo(() => {
    let filtered = clases.filter((clase) => clase.dia === dateKey);
    if (selectedInstructorId !== "all") {
      filtered = filtered.filter((clase) => clase.instructorId === Number(selectedInstructorId));
    }
    return filtered;
  }, [clases, dateKey, selectedInstructorId]);

  // Crear mapa de clase por caballo y hora para acceso rápido O(1)
  const claseMap = useMemo(() => {
    const map: Record<string, Clase> = {};
    clasesDelDia.forEach((clase) => {
      // Normalizar hora a formato HH:MM (quitar segundos si existen)
      const horaKey = clase.hora.slice(0, 5);
      const key = `${clase.caballoId}-${horaKey}`;
      map[key] = clase;
    });
    return map;
  }, [clasesDelDia]);

  // Ordenar caballos alfabéticamente
  const caballosOrdenados = useMemo(() => {
    return [...caballos].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [caballos]);

  // Helpers para obtener nombres
  const getAlumnoNombre = (id: number): string => {
    const alumno = alumnos.find((a) => a.id === id);
    return alumno ? alumno.nombre : "-";
  };

  const getAlumnoNombreCompleto = (id: number): string => {
    const alumno = alumnos.find((a) => a.id === id);
    return alumno ? `${alumno.nombre} ${alumno.apellido}` : "-";
  };

  const getInstructorNombre = (id: number): string => {
    const instructor = instructores.find((i) => i.id === id);
    return instructor ? `${instructor.nombre} ${instructor.apellido}` : "-";
  };

  const getCaballoNombre = (id: number): string => {
    const caballo = caballos.find((c) => c.id === id);
    return caballo?.nombre || "-";
  };

  // Exportar a Excel
  const exportToExcel = () => {
    const dateFormatted = dateKey;
    const instructorLabel = selectedInstructorId === "all" 
      ? "Todos" 
      : getInstructorNombre(Number(selectedInstructorId)).replace(/\s/g, "_");

    // Crear matriz de datos
    const headers = ["Hora", ...caballosOrdenados.map((c) => c.nombre)];
    const rows = TIME_SLOTS.map((hora) => {
      const row: string[] = [hora];
      caballosOrdenados.forEach((caballo) => {
        const key = `${caballo.id}-${hora}`;
        const clase = claseMap[key];
        if (clase) {
          const alumnoName = getAlumnoNombreCompleto(clase.alumnoId);
          const statusEmoji = clase.estado === "ACA" ? "🔵 " : clase.estado === "ASA" ? "🟡 " : "";
          row.push(`${statusEmoji}${alumnoName}`);
        } else {
          row.push("");
        }
      });
      return row;
    });

    // Crear libro de Excel
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    
    // Ajustar ancho de columnas
    const colWidths = headers.map((h, i) => ({ wch: i === 0 ? 8 : Math.max(18, h.length + 2) }));
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clases");

    // Descargar archivo
    const fileName = `Clases_${dateFormatted}${selectedInstructorId !== "all" ? `_${instructorLabel}` : ""}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Controles: Filtro por instructor y Exportar */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 bg-secondary/30 border-b">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedInstructorId} onValueChange={setSelectedInstructorId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filtrar por instructor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los instructores</SelectItem>
              {instructores.map((instructor) => (
                <SelectItem key={instructor.id} value={String(instructor.id)}>
                  {instructor.nombre} {instructor.apellido}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedInstructorId !== "all" && (
            <span className="text-xs text-muted-foreground">
              ({clasesDelDia.length} clases)
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={exportToExcel}>
          <Download className="h-4 w-4 mr-2" />
          Exportar Excel
        </Button>
      </div>

      {/* Tabla estilo Excel */}
      <div className="overflow-auto">
        <table className="w-full min-w-[800px] border-collapse">
          {/* CABECERA: Columna de hora + Nombres de caballos */}
        <thead>
          <tr className="bg-secondary/50">
            <th className="sticky left-0 z-10 w-20 border border-border bg-secondary/80 px-2 py-3 text-left text-sm font-semibold text-muted-foreground backdrop-blur-sm">
              Hora
            </th>
            {caballosOrdenados.map((caballo) => (
              <th
                key={caballo.id}
                className="min-w-[100px] border border-border px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide"
                title={caballo.tipoCaballo === "PRIVADO" ? "Caballo Privado" : "Caballo de Escuela"}
              >
                <span
                  className={cn(
                    caballo.tipoCaballo === "PRIVADO" && "text-primary font-bold"
                  )}
                >
                  {caballo.nombre}
                </span>
              </th>
            ))}
          </tr>
        </thead>

        {/* CUERPO: Filas de horarios */}
        <tbody>
          {TIME_SLOTS.map((hora) => (
            <tr key={hora} className="hover:bg-muted/30 transition-colors">
              {/* Columna fija de hora */}
              <td className="sticky left-0 z-10 border border-border bg-card px-2 py-2 text-sm font-medium text-muted-foreground">
                {hora}
              </td>

              {/* Celdas por cada caballo */}
              {caballosOrdenados.map((caballo) => {
                const key = `${caballo.id}-${hora}`;
                const clase = claseMap[key];

                return (
                  <td
                    key={key}
                    className={cn(
                      "border border-border p-1 text-center transition-colors",
                      !clase && onCellClick && "cursor-pointer hover:bg-primary/10"
                    )}
                    onClick={() => {
                      if (!clase && onCellClick) {
                        onCellClick(caballo, hora);
                      }
                    }}
                  >
                    {clase ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            className={cn(
                              "w-full rounded-md border px-2 py-1.5 text-xs font-medium transition-all hover:scale-105",
                              estadoColors[clase.estado]
                            )}
                          >
                            <div className="truncate">
                              {/* Indicador visual para ACA/ASA */}
                              {clase.estado === "ACA" && <span className="mr-1">🔵</span>}
                              {clase.estado === "ASA" && <span className="mr-1">🟡</span>}
                              {getAlumnoNombre(clase.alumnoId)}
                            </div>
                          </button>
                        </PopoverTrigger>

                        {/* Popover con detalles de la clase */}
                        <PopoverContent className="w-80 p-0" align="center" sideOffset={5}>
                          <div className="p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <h4 className="font-semibold">Detalles de la Clase</h4>
                              <span
                                className={cn(
                                  "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                                  estadoColors[clase.estado]
                                )}
                              >
                                {clase.estado}
                              </span>
                            </div>

                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{clase.hora.slice(0, 5)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>{getAlumnoNombreCompleto(clase.alumnoId)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <UserCheck className="h-4 w-4 text-muted-foreground" />
                                <span>{getInstructorNombre(clase.instructorId)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Landmark className="h-4 w-4 text-muted-foreground" />
                                <span>{getCaballoNombre(clase.caballoId)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                <span>{clase.especialidad}</span>
                              </div>
                            </div>

                            {/* Botones para cambiar estado */}
                            <div className="mt-4 border-t border-border pt-4">
                              <Label className="mb-2 block text-xs text-muted-foreground">
                                Cambiar Estado
                              </Label>
                              <div className="flex flex-wrap gap-1">
                                {(["PROGRAMADA", "EN_CURSO", "COMPLETADA", "CANCELADA", "ACA", "ASA"] as const).map(
                                  (estado) => (
                                    <Button
                                      key={estado}
                                      variant={clase.estado === estado ? "default" : "outline"}
                                      size="sm"
                                      className="text-xs"
                                      onClick={() => onStatusChange(clase.id, estado)}
                                    >
                                      {estado}
                                    </Button>
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      // Celda vacía - muestra guión sutil
                      <span className="text-xs text-muted-foreground/30">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}