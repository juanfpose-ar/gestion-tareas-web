import api from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { Reunion } from '../types';

export interface ReunionRequest {
  titulo: string;
  descripcion?: string;
  fecha: string; // YYYY-MM-DD
  horaInicio?: string;
  horaFin?: string;
  color?: string;
  recordatorioMinutos?: number;
  tableroId: number;
  ticketIds?: number[];
}

export const reunionService = {
  getByTablero: async (tableroId: number): Promise<Reunion[]> => {
    const res = await api.get<Reunion[]>(ENDPOINTS.reuniones.byTablero(tableroId));
    return res.data;
  },

  crear: async (req: ReunionRequest): Promise<Reunion> => {
    const res = await api.post<Reunion>(ENDPOINTS.reuniones.create, req);
    return res.data;
  },

  actualizar: async (id: number, req: ReunionRequest): Promise<Reunion> => {
    const res = await api.put<Reunion>(ENDPOINTS.reuniones.update(id), req);
    return res.data;
  },

  eliminar: async (id: number): Promise<void> => {
    await api.delete(ENDPOINTS.reuniones.delete(id));
  },
};
