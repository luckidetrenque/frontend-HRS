/**
 * useCalendar.ts
 * Hook personalizado que maneja toda la lógica del calendario
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from "date-fns";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  clasesApi,
  alumnosApi,
  instructoresApi,
  caballosApi,
  Clase,
  Alumno,
  Instructor,
  Caballo,
} from "@/lib/api";
import { ViewMode, TIME_SLOTS } from "@/components/calendar/calendar.styles";

export function useCalendar() {
  const queryClient = useQueryClient();

  // Estados del calendario
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");

  // Estados del diálogo crear/editar
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [claseToEdit, setClaseToEdit] = useState<Clase | null>(null);
  const [prefilledCaballoId, setPrefilledCaballoId] = useState<number | null>(
    null,
  );
  const [prefilledHora, setPrefilledHora] = useState<string | null>(null);

  // Estados de otros diálogos
  const [isCopyOpen, setIsCopyOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Estados de filtros
  const [filters, setFilters] = useState({
    alumnoId: "all",
    instructorId: "all",
  });

  // Queries
  const { data: clases = [], isLoading } = useQuery({
    queryKey: ["clases"],
    queryFn: clasesApi.listarDetalladas,
  });

  const { data: alumnos = [] } = useQuery({
    queryKey: ["alumnos"],
    queryFn: alumnosApi.listar,
  });

  const { data: instructores = [] } = useQuery({
    queryKey: ["instructores"],
    queryFn: instructoresApi.listar,
  });

  const { data: caballos = [] } = useQuery({
    queryKey: ["caballos"],
    queryFn: caballosApi.listar,
  });

  // Clases filtradas
  const filteredClases = useMemo(() => {
    return clases.filter((clase: Clase) => {
      if (
        filters.alumnoId !== "all" &&
        clase.alumnoId !== Number(filters.alumnoId)
      ) {
        return false;
      }
      if (
        filters.instructorId !== "all" &&
        clase.instructorId !== Number(filters.instructorId)
      ) {
        return false;
      }
      return true;
    });
  }, [clases, filters]);

  // Generar días para el calendario
  const calendarDays = useMemo(() => {
    if (viewMode === "month") {
      const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
      const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    }
  }, [currentDate, viewMode]);

  // Agrupar clases por fecha
  const clasesByDate = useMemo(() => {
    const grouped: Record<string, Clase[]> = {};
    filteredClases.forEach((clase: Clase) => {
      const dateKey = clase.dia;
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(clase);
    });
    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) => a.hora.localeCompare(b.hora));
    });
    return grouped;
  }, [filteredClases]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: clasesApi.crear,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clases"] });
      setIsDialogOpen(false);
      setClaseToEdit(null);
      setPrefilledCaballoId(null);
      setPrefilledHora(null);
      toast.success(data.__successMessage || "Clase creada correctamente");
    },
    onError: (error: Error) =>
      toast.error(error.message || "Error al crear la clase"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Clase> }) =>
      clasesApi.actualizar(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clases"] });
      setClaseToEdit(null);
      setIsDialogOpen(false);
      toast.success(data.__successMessage || "Clase actualizada correctamente");
    },
    onError: (error: Error) =>
      toast.error(error.message || "Error al actualizar la clase"),
  });

  const deleteMutation = useMutation({
    mutationFn: clasesApi.eliminar,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clases"] });
      toast.success(data.__successMessage || "Clase eliminada correctamente");
    },
    onError: (error: Error) =>
      toast.error(error.message || "Error al eliminar la clase"),
  });

  const copyWeekMutation = useMutation({
    mutationFn: (datos: {
      diaInicioOrigen: string;
      diaInicioDestino: string;
    }) => clasesApi.copiarSemana(datos),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clases"] });
      setIsCopyOpen(false);
      toast.success(data.__successMessage || "Semana copiada correctamente");
    },
    onError: (error: Error) =>
      toast.error(error.message || "Error al copiar la semana"),
  });

  const deleteWeekMutation = useMutation({
    mutationFn: (datos: {
      diaInicioOrigen: string;
      diaInicioDestino: string;
    }) => clasesApi.eliminarClases(datos),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clases"] });
      setIsDeleteOpen(false);
      toast.success(data.__successMessage || "Clases eliminadas correctamente");
    },
    onError: (error: Error) =>
      toast.error(error.message || "Error al eliminar clases"),
  });

  const bulkCancelMutation = useMutation({
    mutationFn: async ({
      claseIds,
      observaciones,
    }: {
      claseIds: number[];
      observaciones: string;
    }) => {
      await Promise.all(
        claseIds.map((id) =>
          clasesApi.actualizar(id, { estado: "CANCELADA", observaciones }),
        ),
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clases"] });
      toast.success(
        `${variables.claseIds.length} clases canceladas correctamente`,
      );
    },
    onError: (error: Error) =>
      toast.error(error.message || "Error al cancelar las clases"),
  });

  // Navegación
  const navigate = (direction: "prev" | "next") => {
    if (viewMode === "month") {
      setCurrentDate(
        direction === "prev"
          ? subMonths(currentDate, 1)
          : addMonths(currentDate, 1),
      );
    } else if (viewMode === "week") {
      setCurrentDate(
        direction === "prev"
          ? subWeeks(currentDate, 1)
          : addWeeks(currentDate, 1),
      );
    } else {
      setCurrentDate(
        direction === "prev"
          ? subDays(currentDate, 1)
          : addDays(currentDate, 1),
      );
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  // Handlers de diálogos
  const handleDayClick = (date: Date) => {
    setCurrentDate(date);
    setClaseToEdit(null);
    setPrefilledCaballoId(null);
    setPrefilledHora(null);
    setIsDialogOpen(true);
  };

  const handleCellClick = (caballo: Caballo, hora: string) => {
    setClaseToEdit(null);
    setPrefilledCaballoId(caballo.id);
    setPrefilledHora(hora);
    setIsDialogOpen(true);
  };

  const handleEditClase = (clase: Clase) => {
    setClaseToEdit(clase);
    setPrefilledCaballoId(null);
    setPrefilledHora(null);
    setIsDialogOpen(true);
  };

  const handleDeleteClase = (claseId: number) => {
    deleteMutation.mutate(claseId);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setClaseToEdit(null);
    setPrefilledCaballoId(null);
    setPrefilledHora(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (claseToEdit) {
      // Modo edición
      const data = {
        alumnoId: Number(formData.get("alumnoId")),
        instructorId: Number(formData.get("instructorId")),
        caballoId: Number(formData.get("caballoId")),
        especialidad: formData.get("especialidad") as
          | "ADIESTRAMIENTO"
          | "EQUINOTERAPIA"
          | "EQUITACION",
        hora: formData.get("hora") as string,
        estado: formData.get("estado") as Clase["estado"],
      };
      updateMutation.mutate({ id: claseToEdit.id, data });
    } else {
      // Modo creación
      const data = {
        alumnoId: Number(formData.get("alumnoId")),
        instructorId: Number(formData.get("instructorId")),
        caballoId: Number(formData.get("caballoId")),
        especialidad: formData.get("especialidad") as
          | "ADIESTRAMIENTO"
          | "EQUINOTERAPIA"
          | "EQUITACION",
        dia: format(currentDate, "yyyy-MM-dd"),
        hora: formData.get("hora") as string,
        estado: "PROGRAMADA" as const,
      };
      createMutation.mutate(data);
    }
  };

  const handleStatusChange = (claseId: number, newStatus: Clase["estado"]) => {
    updateMutation.mutate({ id: claseId, data: { estado: newStatus } });
  };

  const handleBulkCancel = (claseIds: number[], observaciones: string) => {
    bulkCancelMutation.mutate({ claseIds, observaciones });
  };

  const handleCopySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      diaInicioOrigen: formData.get("inicioOri") as string,
      diaInicioDestino: formData.get("inicioDes") as string,
    };

    if (!data.diaInicioOrigen || !data.diaInicioDestino) {
      toast.error("Ambas fechas son obligatorias");
      return;
    }

    copyWeekMutation.mutate(data);
  };

  const handleDeleteSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      diaInicioOrigen: formData.get("inicioOri") as string,
      diaInicioDestino: formData.get("inicioDes") as string,
    };

    if (!data.diaInicioOrigen || !data.diaInicioDestino) {
      toast.error("Ambas fechas son obligatorias");
      return;
    }

    deleteWeekMutation.mutate(data);
  };

  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleResetFilters = () => {
    setFilters({ alumnoId: "all", instructorId: "all" });
  };

  // Exportar a Excel (para vista día)
  const handleExportExcel = () => {
    const dateKey = format(currentDate, "yyyy-MM-dd");

    // Filtrar clases del día
    const clasesDelDia = filteredClases.filter(
      (clase) => clase.dia === dateKey,
    );

    // Crear mapa de clases por caballo y hora
    const claseMap: Record<string, Clase> = {};
    clasesDelDia.forEach((clase) => {
      const horaKey = clase.hora.slice(0, 5);
      const key = `${clase.caballoId}-${horaKey}`;
      claseMap[key] = clase;
    });

    // Caballos ordenados
    const caballosOrdenados = [...caballos].sort((a, b) =>
      a.nombre.localeCompare(b.nombre),
    );

    // Crear matriz de datos
    const headers = ["Hora", ...caballosOrdenados.map((c) => c.nombre)];
    const rows = TIME_SLOTS.map((hora) => {
      const row: string[] = [hora];
      caballosOrdenados.forEach((caballo) => {
        const key = `${caballo.id}-${hora}`;
        const clase = claseMap[key];
        if (clase) {
          const alumnoName = getAlumnoNombreCompleto(clase.alumnoId);
          const statusEmoji =
            clase.estado === "ACA"
              ? "🔵 "
              : clase.estado === "ASA"
                ? "🟡 "
                : "";
          row.push(`${statusEmoji}${alumnoName}`);
        } else {
          row.push("");
        }
      });
      return row;
    });

    // Crear libro de Excel
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const colWidths = headers.map((h, i) => ({
      wch: i === 0 ? 8 : Math.max(18, h.length + 2),
    }));
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clases");

    // Descargar archivo
    const fileName = `Clases_${dateKey}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success("Excel exportado correctamente");
  };

  // Cancelar clases del día (para vista día)
  const handleCancelDayClases = (observaciones: string) => {
    const dateKey = format(currentDate, "yyyy-MM-dd");
    const clasesDelDia = filteredClases.filter(
      (clase) => clase.dia === dateKey,
    );

    // Solo clases cancelables
    const clasesCancelables = clasesDelDia.filter(
      (clase) => clase.estado !== "CANCELADA" && clase.estado !== "COMPLETADA",
    );

    const claseIds = clasesCancelables.map((clase) => clase.id);
    bulkCancelMutation.mutate({ claseIds, observaciones });
  };

  // Obtener clases cancelables del día actual
  const getCancelableDayClases = () => {
    const dateKey = format(currentDate, "yyyy-MM-dd");
    const clasesDelDia = filteredClases.filter(
      (clase) => clase.dia === dateKey,
    );

    return clasesDelDia.filter(
      (clase) => clase.estado !== "CANCELADA" && clase.estado !== "COMPLETADA",
    );
  };

  // Helpers
  const getAlumnoNombre = (id: number) => {
    const alumno = alumnos.find((a: Alumno) => a.id === id);
    return alumno ? alumno.nombre : "-";
  };

  const getAlumnoApellido = (id: number) => {
    const alumno = alumnos.find((a: Alumno) => a.id === id);
    return alumno ? alumno.apellido : "-";
  };

  const getAlumnoNombreCompleto = (id: number) => {
    const alumno = alumnos.find((a: Alumno) => a.id === id);
    return alumno ? `${alumno.nombre} ${alumno.apellido}` : "-";
  };

  const getInstructorNombre = (id: number) => {
    const instructor = instructores.find((i: Instructor) => i.id === id);
    return instructor ? `${instructor.nombre} ${instructor.apellido}` : "-";
  };

  const getCaballoNombre = (id: number) => {
    const caballo = caballos.find((c: Caballo) => c.id === id);
    return caballo?.nombre || "-";
  };

  return {
    // Estado
    currentDate,
    viewMode,
    setViewMode,
    isDialogOpen,
    claseToEdit,
    prefilledCaballoId,
    prefilledHora,
    isCopyOpen,
    setIsCopyOpen,
    isDeleteOpen,
    setIsDeleteOpen,
    filters,

    // Datos
    clases,
    filteredClases,
    alumnos,
    instructores,
    caballos,
    isLoading,
    calendarDays,
    clasesByDate,

    // Mutations
    createMutation,
    updateMutation,
    deleteMutation,
    copyWeekMutation,
    deleteWeekMutation,
    bulkCancelMutation,

    // Handlers
    navigate,
    goToToday,
    handleDayClick,
    handleCellClick,
    handleEditClase,
    handleDeleteClase,
    handleCloseDialog,
    handleSubmit,
    handleStatusChange,
    handleBulkCancel,
    handleCopySubmit,
    handleDeleteSubmit,
    handleFilterChange,
    handleResetFilters,
    handleExportExcel,
    handleCancelDayClases,
    getCancelableDayClases,

    // Helpers
    getAlumnoNombre,
    getAlumnoApellido,
    getAlumnoNombreCompleto,
    getInstructorNombre,
    getCaballoNombre,
  };
}
