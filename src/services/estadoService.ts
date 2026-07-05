import api from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { EstadoTablero } from '../types';

export const estadoService = {
  getEstadosByTablero: async (tableroId: number): Promise<EstadoTablero[]> => {
    const res = await api.get<EstadoTablero[]>(ENDPOINTS.estados.byTablero(tableroId));
    return res.data;
  },

  crearEstado: async (estado: { nombre: string; colorHex?: string; orden: number; tableroId: number }): Promise<EstadoTablero> => {
    const res = await api.post<EstadoTablero>(ENDPOINTS.estados.create, estado);
    return res.data;
  },

  actualizarEstado: async (id: number, estado: { nombre: string; colorHex?: string; orden: number; tableroId?: number }): Promise<EstadoTablero> => {
    const res = await api.put<EstadoTablero>(ENDPOINTS.estados.update(id), estado);
    return res.data;
  },

  eliminarEstado: async (id: number): Promise<void> => {
    await api.delete(ENDPOINTS.estados.delete(id));
  },
};
