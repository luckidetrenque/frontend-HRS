import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
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
  clasesApi,
  alumnosApi,
  instructoresApi,
  caballosApi,
  Clase,
  Alumno,
  Instructor,
  Caballo,
} from "@/lib/api";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

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

export default function ClasesPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingClase, setEditingClase] = useState<Clase | null>(null);

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
      toast.success("Clase creada correctamente");
    },
    onError: () => toast.error("Error al crear la clase"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Clase> }) =>
      clasesApi.actualizar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clases"] });
      setIsOpen(false);
      setEditingClase(null);
      toast.success("Clase actualizada correctamente");
    },
    onError: () => toast.error("Error al actualizar la clase"),
  });

  const deleteMutation = useMutation({
    mutationFn: clasesApi.eliminar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clases"] });
      toast.success("Clase eliminada correctamente");
    },
    onError: () => toast.error("Error al eliminar la clase"),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      alumnoId: Number(formData.get("alumnoId")),
      instructorId: Number(formData.get("instructorId")),
      caballoId: Number(formData.get("caballoId")),
      especialidad: formData.get("especialidad") as string,
      fecha: formData.get("fecha") as string,
      horaInicio: formData.get("horaInicio") as string,
      duracion: 60,
      estado: (formData.get("estado") as Clase["estado"]) || "PENDIENTE",
    };

    if (editingClase) {
      updateMutation.mutate({ id: editingClase.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

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

  const columns = [
    {
      header: "Fecha",
      cell: (row: Clase) => new Date(row.fecha).toLocaleDateString("es-AR"),
    },
    { header: "Hora", accessorKey: "horaInicio" as keyof Clase },
    {
      header: "Alumno",
      cell: (row: Clase) => getAlumnoNombre(row.alumnoId),
    },
    {
      header: "Instructor",
      cell: (row: Clase) => getInstructorNombre(row.instructorId),
    },
    {
      header: "Caballo",
      cell: (row: Clase) => getCaballoNombre(row.caballoId),
    },
    { header: "Especialidad", accessorKey: "especialidad" as keyof Clase },
    {
      header: "Estado",
      cell: (row: Clase) => (
        <StatusBadge status={estadoColors[row.estado] || "default"}>
          {row.estado}
        </StatusBadge>
      ),
    },
    {
      header: "Acciones",
      cell: (row: Clase) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setEditingClase(row);
              setIsOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm("¿Eliminar esta clase?")) {
                deleteMutation.mutate(row.id);
              }
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <PageHeader
        title="Clases"
        description="Programa y gestiona las clases de equitación"
        action={
          <Dialog
            open={isOpen}
            onOpenChange={(open) => {
              setIsOpen(open);
              if (!open) setEditingClase(null);
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Clase
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle className="font-display">
                    {editingClase ? "Editar Clase" : "Nueva Clase"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingClase
                      ? "Modifica los datos de la clase"
                      : "Completa los datos para programar una nueva clase"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fecha">Fecha</Label>
                      <Input
                        id="fecha"
                        name="fecha"
                        type="date"
                        defaultValue={editingClase?.fecha}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="horaInicio">Hora de Inicio</Label>
                      <Input
                        id="horaInicio"
                        name="horaInicio"
                        type="time"
                        defaultValue={editingClase?.horaInicio}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alumnoId">Alumno</Label>
                    <Select
                      name="alumnoId"
                      defaultValue={String(editingClase?.alumnoId || "")}
                    >
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
                    <Select
                      name="instructorId"
                      defaultValue={String(editingClase?.instructorId || "")}
                    >
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
                    <Select
                      name="caballoId"
                      defaultValue={String(editingClase?.caballoId || "")}
                    >
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
                    <Select
                      name="especialidad"
                      defaultValue={editingClase?.especialidad || ""}
                    >
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
                  {editingClase && (
                    <div className="space-y-2">
                      <Label htmlFor="estado">Estado</Label>
                      <Select name="estado" defaultValue={editingClase.estado}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                          <SelectItem value="CONFIRMADA">Confirmada</SelectItem>
                          <SelectItem value="CANCELADA">Cancelada</SelectItem>
                          <SelectItem value="COMPLETADA">Completada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingClase ? "Guardar Cambios" : "Crear Clase"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <DataTable
        columns={columns}
        data={clases}
        isLoading={isLoading}
        emptyMessage="No hay clases programadas"
      />
    </Layout>
  );
}
