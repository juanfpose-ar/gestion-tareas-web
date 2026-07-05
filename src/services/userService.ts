import api from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { Usuario, Rol } from '../types';

export interface UsuarioRequestData {
  username: string;
  password?: string;
  nombreCompleto: string;
  rol: Rol;
  activo?: boolean;
  tablerosIds?: number[];
  email?: string;
  colorAvatar?: string;
}

function mapUsuario(u: any): Usuario {
  return {
    id: u.id,
    username: u.username,
    nombreCompleto: u.nombreCompleto,
    rol: u.rol,
    activo: u.activo,
    tablerosIds: u.tablerosIds || [],
    email: u.email,
    colorAvatar: u.colorAvatar ?? '#0d6efd',
  };
}

export const userService = {
  getUsuarios: async (): Promise<Usuario[]> => {
    const res = await api.get<any[]>(ENDPOINTS.usuarios.list);
    return res.data.map(mapUsuario);
  },

  crearUsuario: async (data: UsuarioRequestData): Promise<Usuario> => {
    const res = await api.post<any>(ENDPOINTS.usuarios.create, data);
    return mapUsuario(res.data);
  },

  actualizarUsuario: async (id: number, data: UsuarioRequestData): Promise<Usuario> => {
    const res = await api.put<any>(ENDPOINTS.usuarios.update(id), data);
    return mapUsuario(res.data);
  },

  blanquearPassword: async (id: number, passwordNueva: string): Promise<void> => {
    await api.post(ENDPOINTS.usuarios.blanquearPassword(id), { passwordNueva });
  },

  cambiarPassword: async (passwordActual: string, passwordNueva: string): Promise<void> => {
    await api.post(ENDPOINTS.auth.cambiarPassword, { passwordActual, passwordNueva });
  },

  eliminarUsuario: async (id: number): Promise<void> => {
    await api.delete(ENDPOINTS.usuarios.update(id));
  },
};
