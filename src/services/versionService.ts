import api from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { Version, VersionEstado } from '../types';

export interface VersionRequest {
  titulo: string;
  fechaVencimiento: string;
  tableroId: number;
  ticketIds: number[];
  estado?: VersionEstado;
}

export const versionService = {
  getByTablero: async (tableroId: number): Promise<Version[]> => {
    const res = await api.get<Version[]>(ENDPOINTS.versiones.byTablero(tableroId));
    return res.data;
  },

  crearVersion: async (req: VersionRequest): Promise<Version> => {
    const res = await api.post<Version>(ENDPOINTS.versiones.create, req);
    return res.data;
  },

  actualizarVersion: async (id: number, req: VersionRequest): Promise<Version> => {
    const res = await api.put<Version>(ENDPOINTS.versiones.update(id), req);
    return res.data;
  },

  eliminarVersion: async (id: number): Promise<void> => {
    await api.delete(ENDPOINTS.versiones.delete(id));
  },
};
