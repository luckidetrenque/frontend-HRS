import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { instructoresApi, Instructor } from "@/lib/api";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function InstructoresPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);

  const { data: instructores = [], isLoading } = useQuery({
    queryKey: ["instructores"],
    queryFn: instructoresApi.listar,
  });

  const createMutation = useMutation({
    mutationFn: instructoresApi.crear,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructores"] });
      setIsOpen(false);
      toast.success("Instructor creado correctamente");
    },
    onError: (error: Error) => toast.error(error.message || "Error al crear el instructor"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Instructor> }) =>
      instructoresApi.actualizar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructores"] });
      setIsOpen(false);
      setEditingInstructor(null);
      toast.success("Instructor actualizado correctamente");
    },
    onError: (error: Error) => toast.error(error.message || "Error al actualizar el instructor"),
  });

  const deleteMutation = useMutation({
    mutationFn: instructoresApi.eliminar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructores"] });
      toast.success("Instructor eliminado correctamente");
    },
    onError: (error: Error) => toast.error(error.message || "Error al eliminar el instructor"),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      dni: formData.get("dni") as string,
      nombre: formData.get("nombre") as string,
      apellido: formData.get("apellido") as string,
      fechaNacimiento: new Date(formData.get("fechaNacimiento") as string).toISOString().split("T")[0],
      telefono: formData.get("telefono") as string,
      email: formData.get("email") as string,
      activo: formData.get("activo") === "on",
    };

    if (editingInstructor) {
      updateMutation.mutate({ id: editingInstructor.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = [
    {
      header: "Nombre y Apellido",
      cell: (row: Instructor) => `${row.nombre} ${row.apellido}`,
    },
    { header: "DNI", accessorKey: "dni" as keyof Instructor },
    { header: "Teléfono", accessorKey: "telefono" as keyof Instructor },
    { header: "Email", accessorKey: "email" as keyof Instructor },
    {
      header: "Estado",
      cell: (row: Instructor) => (
        <StatusBadge status={row.activo ? "success" : "default"}>
          {row.activo ? "Activo" : "Inactivo"}
        </StatusBadge>
      ),
    },
    {
      header: "Acciones",
      cell: (row: Instructor) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setEditingInstructor(row);
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
              if (confirm("¿Eliminar este instructor?")) {
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
        title="Instructores"
        description="Administra el equipo de instructores de la escuela"
        action={
          <Dialog
            open={isOpen}
            onOpenChange={(open) => {
              setIsOpen(open);
              if (!open) setEditingInstructor(null);
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Instructor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle className="font-display">
                    {editingInstructor ? "Editar Instructor" : "Nuevo Instructor"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingInstructor
                      ? "Modifica los datos del instructor"
                      : "Completa los datos para registrar un nuevo instructor"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre</Label>
                      <Input
                        id="nombre"
                        name="nombre"
                        defaultValue={editingInstructor?.nombre}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apellido">Apellido</Label>
                      <Input
                        id="apellido"
                        name="apellido"
                        defaultValue={editingInstructor?.apellido}
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
                        defaultValue={editingInstructor?.dni}
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
                        defaultValue={editingInstructor?.fechaNacimiento}
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
                        type="number"
                        defaultValue={editingInstructor?.telefono}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        defaultValue={editingInstructor?.email}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={editingInstructor?.email}
                      required
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      id="activo"
                      name="activo"
                      defaultChecked={editingInstructor?.activo ?? true}
                    />
                    <Label htmlFor="activo">Instructor activo</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingInstructor ? "Guardar Cambios" : "Crear Instructor"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <DataTable
        columns={columns}
        data={instructores}
        isLoading={isLoading}
        emptyMessage="No hay instructores registrados"
      />
    </Layout>
  );
}
