const API_BASE_URL = "http://localhost:8080/api/v1/auth";

export interface User {
  id: number;
  username: string;
  email: string;
  // nombre?: string;
  // apellido?: string;
  rol?: string;
  fechaCreacion: string;
  personaDni?: string;
  personaTipoDni?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  id: number;
  username: string;
  email: string;
  // nombre?: string;
  // apellido?: string;
  rol?: string;
  fechaCreacion: string;
  personaDni?: string;
  personaTipoDni?: string;
}

// Codifica credenciales en Base64 para Basic Auth
export const encodeCredentials = (
  username: string,
  password: string
): string => {
  return btoa(`${username}:${password}`);
};

// Obtiene las credenciales guardadas
export const getStoredCredentials = (): string | null => {
  return localStorage.getItem("authCredentials");
};

// Guarda las credenciales
export const storeCredentials = (credentials: string): void => {
  localStorage.setItem("authCredentials", credentials);
};

// Limpia las credenciales
export const clearCredentials = (): void => {
  localStorage.removeItem("authCredentials");
  localStorage.removeItem("user");
};

// Login con Basic Auth
export const login = async (credentials: LoginCredentials): Promise<User> => {
  const encoded = encodeCredentials(credentials.username, credentials.password);

  const response = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${encoded}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Credenciales incorrectas");
  }

  const user = await response.json();

  storeCredentials(encoded);
  localStorage.setItem("user", JSON.stringify(user));

  return user;
};

// Registro de usuario
export const register = async (data: RegisterData): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Error al registrar usuario");
  }

  return response.json();
};

// Logout
export const logout = async (): Promise<void> => {
  const credentials = getStoredCredentials();

  try {
    await fetch(`${API_BASE_URL}/logout`, {
      method: "POST",
      headers: {
        ...(credentials && { Authorization: `Basic ${credentials}` }),
      },
    });
  } finally {
    clearCredentials();
  }
};

// Helper para hacer peticiones autenticadas
export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const credentials = getStoredCredentials();

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(credentials && { Authorization: `Basic ${credentials}` }),
    },
  });
};
