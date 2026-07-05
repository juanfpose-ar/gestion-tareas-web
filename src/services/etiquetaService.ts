import api from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import type { Etiqueta } from '../types';

export const etiquetaService = {
  getEtiquetasByTablero: async (tableroId: number): Promise<Etiqueta[]> => {
    const res = await api.get<Etiqueta[]>(ENDPOINTS.etiquetas.byTablero(tableroId));
    return res.data;
  },

  getGlobales: async (): Promise<Etiqueta[]> => {
    const res = await api.get<Etiqueta[]>(ENDPOINTS.etiquetas.globales);
    return res.data;
  },

  crearEtiqueta: async (etiqueta: { nombre: string; colorHex?: string; colorTexto?: string; tableroId?: number | null }): Promise<Etiqueta> => {
    const color = etiqueta.colorHex ?? '#3b82f6';
    const res = await api.post<Etiqueta>(ENDPOINTS.etiquetas.create, {
      nombre: etiqueta.nombre,
      color,
      colorHex: color,
      colorTexto: etiqueta.colorTexto ?? '#ffffff',
      tableroId: etiqueta.tableroId ?? null,
    });
    return res.data;
  },

  eliminarEtiqueta: async (id: number): Promise<void> => {
    await api.delete(ENDPOINTS.etiquetas.delete(id));
  },
};
