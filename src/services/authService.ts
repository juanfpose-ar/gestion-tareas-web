import api from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import type { LoginResponse, Usuario } from '../types';

interface RawLoginResponse {
  token?: string;
  id: number;
  username: string;
  nombreCompleto?: string;
  rol: string;
  usuario?: Usuario;
}

function mapToUsuario(data: RawLoginResponse): Usuario {
  return data.usuario ?? {
    id: data.id,
    username: data.username,
    nombreCompleto: data.nombreCompleto,
    rol: data.rol as Usuario['rol'],
  };
}

export const authService = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const res = await api.post<RawLoginResponse>(ENDPOINTS.auth.login, { username, password });
    const data = res.data;
    return {
      token: data.token ?? '',
      usuario: mapToUsuario(data),
      id: data.id,
      username: data.username,
      nombreCompleto: data.nombreCompleto,
      rol: data.rol as Usuario['rol'],
    };
  },

  logout: async (): Promise<void> => {
    await api.post(ENDPOINTS.auth.logout);
  },

  getMe: async (): Promise<Usuario> => {
    const res = await api.get<RawLoginResponse>(ENDPOINTS.auth.me);
    return mapToUsuario(res.data);
  },
};
