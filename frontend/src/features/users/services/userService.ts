import { api } from '../../../lib/api';

export interface User {
  _id: string;
  id: string;
  email: string;
  role: string;
  ubicacion?: {
    _id: string;
    nombre: string;
  };
}

export interface CreateUserData {
  email: string;
  password: string;
  role: string;
  ubicacion?: {
    _id: string;
    nombre: string;
  };
}

const userService = {
  // Obtener todos los usuarios
  getUsers: async (ubicacion?: string) => {
    const params = ubicacion ? { ubicacion } : {};
    const response = await api.get('/users', { params });
    return response.data;
  },

  // Crear un nuevo usuario
  createUser: async (userData: CreateUserData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  // Actualizar un usuario existente
  updateUser: async (id: string, userData: Partial<CreateUserData>) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  // Eliminar un usuario
  deleteUser: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Obtener un usuario específico
  getUser: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  }
};

export default userService;