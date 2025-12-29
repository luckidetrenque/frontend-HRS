import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon,
  Clock,
  User,
  UserCheck,
  Landmark,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const estadoColors: Record<string, "success" | "warning" | "error" | "info" | "default"> = {
  PENDIENTE: "warning",
  CONFIRMADA: "info",
  CANCELADA: "error",
  COMPLETADA: "success",
};

const especialidades = [
  "Salto",
  "Doma",
  "Polo",
  "Paseo",
  "Principiante",
  "Intermedio",
  "Avanzado",
];

type ViewMode = "month" | "week";

export default function CalendarioPage() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedClase, setSelectedClase] = useState<Clase | null>(null);

  const { data: clases = [], isLoading } = useQuery({
    queryKey: ["clases"],
    queryFn: clasesApi.listar,
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

  const createMutation = useMutation({
    mutationFn: clasesApi.crear,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clases"] });
      setIsOpen(false);
      setSelectedDate(null);
      toast.success("Clase creada correctamente");
    },
    onError: () => toast.error("Error al crear la clase"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Clase> }) =>
      clasesApi.actualizar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clases"] });
      setSelectedClase(null);
      toast.success("Clase actualizada correctamente");
    },
    onError: () => toast.error("Error al actualizar la clase"),
  });

  // Generate days for the calendar view
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

  // Group clases by date
  const clasesByDate = useMemo(() => {
    const grouped: Record<string, Clase[]> = {};
    clases.forEach((clase: Clase) => {
      const dateKey = clase.fecha;
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(clase);
    });
    // Sort by time
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    });
    return grouped;
  }, [clases]);

  const navigate = (direction: "prev" | "next") => {
    if (viewMode === "month") {
      setCurrentDate(direction === "prev" ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    } else {
      setCurrentDate(direction === "prev" ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  const getAlumnoNombre = (id: number) => {
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

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      alumnoId: Number(formData.get("alumnoId")),
      instructorId: Number(formData.get("instructorId")),
      caballoId: Number(formData.get("caballoId")),
      especialidad: formData.get("especialidad") as string,
      fecha: selectedDate ? format(selectedDate, "yyyy-MM-dd") : "",
      horaInicio: formData.get("horaInicio") as string,
      duracion: 60,
      estado: "PENDIENTE" as const,
    };
    createMutation.mutate(data);
  };

  const handleStatusChange = (claseId: number, newStatus: Clase["estado"]) => {
    updateMutation.mutate({ id: claseId, data: { estado: newStatus } });
  };

  return (
    <Layout>
      <PageHeader
        title="Calendario de Clases"
        description="Vista interactiva de las clases programadas"
      />

      {/* Calendar Controls */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>
            Hoy
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigate("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="ml-4 font-display text-xl font-semibold capitalize">
            {format(currentDate, viewMode === "month" ? "MMMM yyyy" : "'Semana del' d 'de' MMMM", { locale: es })}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("month")}
          >
            Mes
          </Button>
          <Button
            variant={viewMode === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("week")}
          >
            Semana
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-border bg-secondary/50">
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
              <div
                key={day}
                className="p-3 text-center text-sm font-semibold text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className={cn(
            "grid grid-cols-7",
            viewMode === "week" ? "min-h-[400px]" : ""
          )}>
            {calendarDays.map((day, index) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayClases = clasesByDate[dateKey] || [];
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isToday(day);

              return (
                <div
                  key={index}
                  className={cn(
                    "min-h-[120px] border-b border-r border-border p-2 transition-colors",
                    !isCurrentMonth && "bg-muted/30",
                    isCurrentDay && "bg-accent/20",
                    viewMode === "week" && "min-h-[350px]"
                  )}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <button
                      onClick={() => handleDayClick(day)}
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium transition-colors hover:bg-primary hover:text-primary-foreground",
                        isCurrentDay && "bg-primary text-primary-foreground",
                        !isCurrentMonth && "text-muted-foreground"
                      )}
                    >
                      {format(day, "d")}
                    </button>
                    {dayClases.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {dayClases.length} clase{dayClases.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* Classes for this day */}
                  <div className="space-y-1">
                    {dayClases.slice(0, viewMode === "week" ? 10 : 3).map((clase: Clase) => (
                      <Popover key={clase.id}>
                        <PopoverTrigger asChild>
                          <button
                            className={cn(
                              "w-full rounded-md px-2 py-1 text-left text-xs transition-colors",
                              clase.estado === "COMPLETADA" && "bg-success/20 text-success hover:bg-success/30",
                              clase.estado === "CONFIRMADA" && "bg-info/20 text-info hover:bg-info/30",
                              clase.estado === "PENDIENTE" && "bg-warning/20 text-warning hover:bg-warning/30",
                              clase.estado === "CANCELADA" && "bg-destructive/20 text-destructive hover:bg-destructive/30"
                            )}
                          >
                            <span className="font-medium">{clase.horaInicio.slice(0, 5)}</span>
                            <span className="ml-1 truncate">{getAlumnoNombre(clase.alumnoId).split(" ")[0]}</span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="start">
                          <div className="p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <h4 className="font-display font-semibold">Detalles de la Clase</h4>
                              <StatusBadge status={estadoColors[clase.estado]}>
                                {clase.estado}
                              </StatusBadge>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{clase.horaInicio} - {clase.duracion} min</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>{getAlumnoNombre(clase.alumnoId)}</span>
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
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                <span>{clase.especialidad}</span>
                              </div>
                            </div>
                            <div className="mt-4 border-t border-border pt-4">
                              <Label className="mb-2 block text-xs text-muted-foreground">
                                Cambiar Estado
                              </Label>
                              <div className="flex flex-wrap gap-1">
                                {(["PENDIENTE", "CONFIRMADA", "COMPLETADA", "CANCELADA"] as const).map((estado) => (
                                  <Button
                                    key={estado}
                                    variant={clase.estado === estado ? "default" : "outline"}
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => handleStatusChange(clase.id, estado)}
                                  >
                                    {estado}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    ))}
                    {dayClases.length > (viewMode === "week" ? 10 : 3) && (
                      <span className="block text-center text-xs text-muted-foreground">
                        +{dayClases.length - (viewMode === "week" ? 10 : 3)} más
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-warning/50" />
          <span className="text-sm text-muted-foreground">Pendiente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-info/50" />
          <span className="text-sm text-muted-foreground">Confirmada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-success/50" />
          <span className="text-sm text-muted-foreground">Completada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-destructive/50" />
          <span className="text-sm text-muted-foreground">Cancelada</span>
        </div>
      </div>

      {/* New Class Dialog */}
      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) setSelectedDate(null);
      }}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="font-display">Nueva Clase</DialogTitle>
              <DialogDescription>
                {selectedDate && (
                  <>Programar clase para el {format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: es })}</>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="horaInicio">Hora de Inicio</Label>
                <Input
                  id="horaInicio"
                  name="horaInicio"
                  type="time"
                  defaultValue="09:00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alumnoId">Alumno</Label>
                <Select name="alumnoId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar alumno" />
                  </SelectTrigger>
                  <SelectContent>
                    {alumnos.map((alumno: Alumno) => (
                      <SelectItem key={alumno.id} value={String(alumno.id)}>
                        {alumno.nombre} {alumno.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="instructorId">Instructor</Label>
                <Select name="instructorId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar instructor" />
                  </SelectTrigger>
                  <SelectContent>
                    {instructores
                      .filter((i: Instructor) => i.activo)
                      .map((instructor: Instructor) => (
                        <SelectItem key={instructor.id} value={String(instructor.id)}>
                          {instructor.nombre} {instructor.apellido}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="caballoId">Caballo</Label>
                <Select name="caballoId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar caballo" />
                  </SelectTrigger>
                  <SelectContent>
                    {caballos
                      .filter((c: Caballo) => c.disponible)
                      .map((caballo: Caballo) => (
                        <SelectItem key={caballo.id} value={String(caballo.id)}>
                          {caballo.nombre} ({caballo.tipo === "ESCUELA" ? "Escuela" : "Privado"})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="especialidad">Especialidad</Label>
                <Select name="especialidad" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar especialidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {especialidades.map((esp) => (
                      <SelectItem key={esp} value={esp}>
                        {esp}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending}>
                Crear Clase
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
