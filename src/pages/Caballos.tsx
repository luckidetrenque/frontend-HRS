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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { caballosApi, Caballo } from "@/lib/api";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function CaballosPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingCaballo, setEditingCaballo] = useState<Caballo | null>(null);

  const { data: caballos = [], isLoading } = useQuery({
    queryKey: ["caballos"],
    queryFn: caballosApi.listar,
  });

  const createMutation = useMutation({
    mutationFn: caballosApi.crear,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caballos"] });
      setIsOpen(false);
      toast.success("Caballo creado correctamente");
    },
    onError: (error: Error) => toast.error(error.message || "Error al crear el caballo"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Caballo> }) =>
      caballosApi.actualizar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caballos"] });
      setIsOpen(false);
      setEditingCaballo(null);
      toast.success("Caballo actualizado correctamente");
    },
    onError: (error: Error) => toast.error(error.message || "Error al actualizar el caballo"),
  });

  const deleteMutation = useMutation({
    mutationFn: caballosApi.eliminar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caballos"] });
      toast.success("Caballo eliminado correctamente");
    },
    onError: (error: Error) => toast.error(error.message || "Error al eliminar el caballo"),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      nombre: formData.get("nombre") as string,
      tipoCaballo: formData.get("tipoCaballo") as "ESCUELA" | "PRIVADO",
      disponible: formData.get("disponible") === "on",
    };

    if (editingCaballo) {
      updateMutation.mutate({ id: editingCaballo.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = [
    { header: "Nombre", accessorKey: "nombre" as keyof Caballo },
    {
      header: "Tipo",
      cell: (row: Caballo) => (
        <StatusBadge status={row.tipoCaballo === "ESCUELA" ? "info" : "warning"}>
          {row.tipoCaballo === "ESCUELA" ? "Escuela" : "Privado"}
        </StatusBadge>
      ),
    },
    {
      header: "Disponibilidad",
      cell: (row: Caballo) => (
        <StatusBadge status={row.disponible ? "success" : "default"}>
          {row.disponible ? "Disponible" : "No Disponible"}
        </StatusBadge>
      ),
    },
    {
      header: "Acciones",
      cell: (row: Caballo) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setEditingCaballo(row);
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
              if (confirm("¿Eliminar este caballo?")) {
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
        title="Caballos"
        description="Control de caballos de la escuela y privados"
        action={
          <Dialog
            open={isOpen}
            onOpenChange={(open) => {
              setIsOpen(open);
              if (!open) setEditingCaballo(null);
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Caballo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle className="font-display">
                    {editingCaballo ? "Editar Caballo" : "Nuevo Caballo"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingCaballo
                      ? "Modifica los datos del caballo"
                      : "Completa los datos para registrar un nuevo caballo"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      name="nombre"
                      defaultValue={editingCaballo?.nombre}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipoCaballo">Tipo</Label>
                    <Select
                      name="tipoCaballo"
                      defaultValue={editingCaballo?.tipoCaballo || "ESCUELA"}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ESCUELA">Escuela</SelectItem>
                        <SelectItem value="PRIVADO">Privado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      id="disponible"
                      name="disponible"
                      defaultChecked={editingCaballo?.disponible ?? true}
                    />
                    <Label htmlFor="disponible">Disponible</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingCaballo ? "Guardar Cambios" : "Crear Caballo"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <DataTable
        columns={columns}
        data={caballos}
        isLoading={isLoading}
        emptyMessage="No hay caballos registrados"
      />
    </Layout>
  );
}
