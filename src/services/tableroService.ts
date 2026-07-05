import api from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import type { Tablero, Usuario } from '../types';

export const tableroService = {
  getMisTableros: async (): Promise<Tablero[]> => {
    const res = await api.get<Tablero[]>(ENDPOINTS.tableros.list);
    return res.data;
  },

  getTodosTableros: async (): Promise<Tablero[]> => {
    const res = await api.get<Tablero[]>(ENDPOINTS.tableros.adminTodos);
    return res.data;
  },

  getTableroById: async (id: number): Promise<Tablero> => {
    const res = await api.get<Tablero>(ENDPOINTS.tableros.byId(id));
    return res.data;
  },

  crearTablero: async (titulo: string, descripcion?: string, imagenFondoUrl?: string): Promise<Tablero> => {
    const res = await api.post<Tablero>(ENDPOINTS.tableros.list, { titulo, descripcion, imagenFondoUrl });
    return res.data;
  },

  actualizarTablero: async (id: number, titulo: string, descripcion?: string): Promise<Tablero> => {
    const res = await api.put<Tablero>(ENDPOINTS.tableros.byId(id), { titulo, descripcion });
    return res.data;
  },

  archivarTablero: async (id: number, archivado: boolean): Promise<Tablero> => {
    const res = await api.patch<Tablero>(`${ENDPOINTS.tableros.archivar(id)}?archivado=${archivado}`);
    return res.data;
  },

  eliminarTablero: async (id: number): Promise<void> => {
    await api.delete(ENDPOINTS.tableros.byId(id));
  },

  getMiembros: async (tableroId: number): Promise<Usuario[]> => {
    const res = await api.get<Usuario[]>(ENDPOINTS.tableros.miembros(tableroId));
    return res.data;
  },
};
