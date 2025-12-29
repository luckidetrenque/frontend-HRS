// API Configuration for HRS - Escuela de Equitación
const API_BASE_URL = "http://localhost:8080/api/v1";

// Types based on the Java models
export interface Alumno {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  fechaInscripcion: string;
  cantidadClases: number;
  tieneCaballoPropio: boolean;
}

export interface Instructor {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  activo: boolean;
}

export interface Caballo {
  id: number;
  nombre: string;
  tipo: "ESCUELA" | "PRIVADO";
  disponible: boolean;
  alumnoId?: number;
}

export interface Clase {
  id: number;
  alumnoId: number;
  instructorId: number;
  caballoId: number;
  especialidad: string;
  fecha: string;
  horaInicio: string;
  duracion: number;
  estado: "PENDIENTE" | "CONFIRMADA" | "CANCELADA" | "COMPLETADA";
}

export interface ClaseDetallada extends Clase {
  alumno?: Alumno;
  instructor?: Instructor;
  caballo?: Caballo;
}

// API Functions
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Error: ${response.status}`);
  }
  return response.json();
}

// Alumnos
export const alumnosApi = {
  listar: async (): Promise<Alumno[]> => {
    const response = await fetch(`${API_BASE_URL}/alumnos`);
    return handleResponse<Alumno[]>(response);
  },
  obtener: async (id: number): Promise<Alumno> => {
    const response = await fetch(`${API_BASE_URL}/alumnos/${id}`);
    return handleResponse<Alumno>(response);
  },
  crear: async (alumno: Omit<Alumno, "id">): Promise<Alumno> => {
    const response = await fetch(`${API_BASE_URL}/alumnos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(alumno),
    });
    return handleResponse<Alumno>(response);
  },
  actualizar: async (id: number, alumno: Partial<Alumno>): Promise<Alumno> => {
    const response = await fetch(`${API_BASE_URL}/alumnos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(alumno),
    });
    return handleResponse<Alumno>(response);
  },
  eliminar: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/alumnos/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Error al eliminar");
  },
};

// Instructores
export const instructoresApi = {
  listar: async (): Promise<Instructor[]> => {
    const response = await fetch(`${API_BASE_URL}/instructores`);
    return handleResponse<Instructor[]>(response);
  },
  obtener: async (id: number): Promise<Instructor> => {
    const response = await fetch(`${API_BASE_URL}/instructores/${id}`);
    return handleResponse<Instructor>(response);
  },
  crear: async (instructor: Omit<Instructor, "id">): Promise<Instructor> => {
    const response = await fetch(`${API_BASE_URL}/instructores`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(instructor),
    });
    return handleResponse<Instructor>(response);
  },
  actualizar: async (id: number, instructor: Partial<Instructor>): Promise<Instructor> => {
    const response = await fetch(`${API_BASE_URL}/instructores/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(instructor),
    });
    return handleResponse<Instructor>(response);
  },
  eliminar: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/instructores/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Error al eliminar");
  },
};

// Caballos
export const caballosApi = {
  listar: async (): Promise<Caballo[]> => {
    const response = await fetch(`${API_BASE_URL}/caballos`);
    return handleResponse<Caballo[]>(response);
  },
  obtener: async (id: number): Promise<Caballo> => {
    const response = await fetch(`${API_BASE_URL}/caballos/${id}`);
    return handleResponse<Caballo>(response);
  },
  crear: async (caballo: Omit<Caballo, "id">): Promise<Caballo> => {
    const response = await fetch(`${API_BASE_URL}/caballos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(caballo),
    });
    return handleResponse<Caballo>(response);
  },
  actualizar: async (id: number, caballo: Partial<Caballo>): Promise<Caballo> => {
    const response = await fetch(`${API_BASE_URL}/caballos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(caballo),
    });
    return handleResponse<Caballo>(response);
  },
  eliminar: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/caballos/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Error al eliminar");
  },
};

// Clases
export const clasesApi = {
  listar: async (): Promise<Clase[]> => {
    const response = await fetch(`${API_BASE_URL}/clases`);
    return handleResponse<Clase[]>(response);
  },
  listarDetalladas: async (): Promise<ClaseDetallada[]> => {
    const response = await fetch(`${API_BASE_URL}/clases/detalle`);
    return handleResponse<ClaseDetallada[]>(response);
  },
  obtener: async (id: number): Promise<Clase> => {
    const response = await fetch(`${API_BASE_URL}/clases/${id}`);
    return handleResponse<Clase>(response);
  },
  crear: async (clase: Omit<Clase, "id">): Promise<Clase> => {
    const response = await fetch(`${API_BASE_URL}/clases`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clase),
    });
    return handleResponse<Clase>(response);
  },
  actualizar: async (id: number, clase: Partial<Clase>): Promise<Clase> => {
    const response = await fetch(`${API_BASE_URL}/clases/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clase),
    });
    return handleResponse<Clase>(response);
  },
  eliminar: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/clases/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Error al eliminar");
  },
  cambiarEstado: async (id: number, estado: Clase["estado"]): Promise<Clase> => {
    const response = await fetch(`${API_BASE_URL}/clases/${id}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    return handleResponse<Clase>(response);
  },
};
