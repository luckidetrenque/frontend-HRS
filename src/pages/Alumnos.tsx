import { useState, useMemo } from "react";
// import { FloatingWhatsApp } from "@digicroz/react-floating-whatsapp";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FilterBar } from "@/components/ui/filter-bar";
import { PaginationControls } from "@/components/ui/pagination-controls";
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
import { alumnosApi, Alumno } from "@/lib/api";
import {
  Plus,
  Pencil,
  Trash2,
  Bot,
  MessageCircle,
  MessageCircleMore,
} from "lucide-react";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

export default function AlumnosPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingAlumno, setEditingAlumno] = useState<Alumno | null>(null);

  // Estados de filtros
  const [filters, setFilters] = useState({
    cantidadClases: "all",
    activo: "all",
    propietario: "all",
  });

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data: alumnos = [], isLoading } = useQuery({
    queryKey: ["alumnos"],
    queryFn: alumnosApi.listar,
  });

  // const [alumnoActivo, setAlumnoActivo] = useState<Alumno | null>(null);

  // Filtrar datos
  const filteredData = useMemo(() => {
    return alumnos.filter((alumno: Alumno) => {
      if (
        filters.cantidadClases !== "all" &&
        String(alumno.cantidadClases) !== filters.cantidadClases
      ) {
        return false;
      }
      if (
        filters.activo !== "all" &&
        String(alumno.activo) !== filters.activo
      ) {
        return false;
      }
      if (
        filters.propietario !== "all" &&
        String(alumno.propietario) !== filters.propietario
      ) {
        return false;
      }
      return true;
    });
  }, [alumnos, filters]);

  // Paginar datos
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  // Configuración de filtros
  const filterConfig = [
    {
      name: "cantidadClases",
      label: "Clases/Mes",
      type: "select" as const,
      options: [
        { label: "4 clases", value: "4" },
        { label: "8 clases", value: "8" },
        { label: "12 clases", value: "12" },
        { label: "16 clases", value: "16" },
      ],
    },
    {
      name: "activo",
      label: "Estado",
      type: "select" as const,
      options: [
        { label: "Activo", value: "true" },
        { label: "Inactivo", value: "false" },
      ],
    },
    {
      name: "propietario",
      label: "Propietario",
      type: "select" as const,
      options: [
        { label: "Sí", value: "true" },
        { label: "No", value: "false" },
      ],
    },
  ];

  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset a página 1 al filtrar
  };

  const handleResetFilters = () => {
    setFilters({
      cantidadClases: "all",
      activo: "all",
      propietario: "all",
    });
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const createMutation = useMutation({
    mutationFn: alumnosApi.crear,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alumnos"] });
      setIsOpen(false);
      toast.success("Alumno creado correctamente");
    },
    onError: (error: Error) =>
      toast.error(error.message || "Error al crear el alumno"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Alumno> }) =>
      alumnosApi.actualizar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alumnos"] });
      setIsOpen(false);
      setEditingAlumno(null);
      toast.success("Alumno actualizado correctamente");
    },
    onError: (error: Error) =>
      toast.error(error.message || "Error al actualizar el alumno"),
  });

  const deleteMutation = useMutation({
    mutationFn: alumnosApi.eliminar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alumnos"] });
      toast.success("Alumno eliminado correctamente");
    },
    onError: (error: Error) =>
      toast.error(error.message || "Error al eliminar el alumno"),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      dni: formData.get("dni") as string,
      nombre: formData.get("nombre") as string,
      apellido: formData.get("apellido") as string,
      fechaNacimiento: new Date(formData.get("fechaNacimiento") as string)
        .toISOString()
        .split("T")[0],
      telefono: formData.get("telefono") as string,
      email: formData.get("email") as string,
      fechaInscripcion: new Date(formData.get("fechaInscripcion") as string)
        .toISOString()
        .split("T")[0],
      cantidadClases: Number(formData.get("cantidadClases")),
      propietario: formData.get("propietario") === "off",
      activo: formData.get("activo") === "on",
    };

    if (editingAlumno) {
      updateMutation.mutate({ id: editingAlumno.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = [
    {
      header: "Nombre y Apellido",
      cell: (row: Alumno) => `${row.nombre} ${row.apellido}`,
    },
    { header: "DNI", accessorKey: "dni" as keyof Alumno },
    { header: "Teléfono", accessorKey: "telefono" as keyof Alumno },
    { header: "Email", accessorKey: "email" as keyof Alumno },
    {
      header: "Inscripción",
      cell: (row: Alumno) =>
        `${row.fechaInscripcion.split("-")[2]}/${
          row.fechaInscripcion.split("-")[1]
        }/${row.fechaInscripcion.split("-")[0]}`,
    },
    {
      header: "Clases/Mes",
      cell: (row: Alumno) => (
        <span className="font-medium">{row.cantidadClases}</span>
      ),
    },
    {
      header: "Estado",
      cell: (row: Alumno) => (
        <StatusBadge status={row.activo ? "success" : "default"}>
          {row.activo ? "Activo" : "Inactivo"}
        </StatusBadge>
      ),
    },
    {
      header: "Propietario",
      cell: (row: Alumno) => (
        <StatusBadge status={row.propietario ? "success" : "default"}>
          {row.propietario ? "Sí" : "No"}
        </StatusBadge>
      ),
    },
    {
      header: "Acciones",
      cell: (row: Alumno) => (
        <div className="flex gap-2">
          <Button
            title={`Enviar mensaje a ${row.nombre} ${row.apellido}`}
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              // location.href = `https://wa.me/549221${row.telefono}`;
              window.open(
                encodeURI(
                  `https://wa.me/${row.telefono}?text=Hola ${row.nombre}, te contactamos desde la Escuela para avisarte que... `,
                ),
                "_blank",
              );
              // setAlumnoActivo(row);
            }}
          >
            <MessageCircleMore className="h-4 w-4 text-success" />
          </Button>
          {/* {alumnoActivo && (
            <FloatingWhatsApp
              phoneNumber={`549221${alumnoActivo.telefono}`}
              accountName={alumnoActivo.nombre}
              // avatar={alumnoActivo.avatar}
              statusMessage="En línea"
              chatMessage={`Hola 👋, ¿en qué puedo ayudarte, ${alumnoActivo.nombre}?`}
              placeholder="Escribe un mensaje..."
              allowClickAway={true} // Cierra al hacer clic fuera
              notification={true} // Muestra un punto de notificación
              onClose={() => setAlumnoActivo(null)} // Limpia el estado al cerrar
            />
          )} */}

          <Button
            title={`Editar datos del alumno ${row.nombre} ${row.apellido}`}
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setEditingAlumno(row);
              setIsOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            title={`Eliminar el alumno ${row.nombre} ${row.apellido}`}
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm("¿Eliminar este alumno?")) {
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
        title="Alumnos"
        description="Gestiona los alumnos inscriptos en la escuela"
        action={
          <Dialog
            open={isOpen}
            onOpenChange={(open) => {
              setIsOpen(open);
              if (!open) setEditingAlumno(null);
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Alumno
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle className="font-display">
                    {editingAlumno ? "Editar Alumno" : "Nuevo Alumno"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingAlumno
                      ? "Modifica los datos del alumno"
                      : "Completa los datos para registrar un nuevo alumno"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre/s</Label>
                      <Input
                        id="nombre"
                        name="nombre"
                        type="text"
                        defaultValue={editingAlumno?.nombre}
                        placeholder="Nombre/s del alumno"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apellido">Apellido/s</Label>
                      <Input
                        id="apellido"
                        name="apellido"
                        type="text"
                        defaultValue={editingAlumno?.apellido}
                        placeholder="Apellido/s del alumno"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dni">DNI</Label>
                      <Input
                        id="dni"
                        name="dni"
                        type="number"
                        defaultValue={editingAlumno?.dni}
                        placeholder="Solo números sin puntos"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fechaNacimiento">
                        Fecha de Nacimiento
                      </Label>
                      <Input
                        id="fechaNacimiento"
                        name="fechaNacimiento"
                        type="date"
                        defaultValue={editingAlumno?.fechaNacimiento}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="telefono">Teléfono</Label>
                      <Input
                        id="telefono"
                        name="telefono"
                        type="tel"
                        defaultValue={editingAlumno?.telefono}
                        placeholder="Sin el 0 ni el 15"
                        pattern="\+?[0-9]*"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        defaultValue={editingAlumno?.email}
                        placeholder="alumno@correo.com"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fechaInscripcion">
                        Fecha de Inscripcion
                      </Label>
                      <Input
                        id="fechaInscripcion"
                        name="fechaInscripcion"
                        type="date"
                        defaultValue={
                          editingAlumno?.fechaInscripcion ||
                          new Date().toISOString().split("T")[0]
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cantidadClases">Clases por Mes</Label>
                      <Select
                        name="cantidadClases"
                        defaultValue={String(
                          editingAlumno?.cantidadClases || 4,
                        )}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="4">4 clases</SelectItem>
                          <SelectItem value="8">8 clases</SelectItem>
                          <SelectItem value="12">12 clases</SelectItem>
                          <SelectItem value="16">16 clases</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Switch
                        id="propietario"
                        name="propietario"
                        defaultChecked={editingAlumno?.propietario}
                      />
                      <Label htmlFor="propietario">Tiene caballo propio</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        id="activo"
                        name="activo"
                        defaultChecked={editingAlumno?.activo ?? true}
                      />
                      <Label htmlFor="activo">Esta activo</Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                  >
                    {editingAlumno ? "Guardar Cambios" : "Crear Alumno"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="space-y-4">
        <FilterBar
          filters={filterConfig}
          values={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        <DataTable
          columns={columns}
          data={paginatedData}
          isLoading={isLoading}
          emptyMessage="No hay alumnos que coincidan con los filtros"
        />

        {filteredData.length > 0 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredData.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </div>
    </Layout>
  );
}
