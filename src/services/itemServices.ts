import api from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { ChecklistItem, NotaTarea, Recordatorio, Adjunto, VinculoDTO } from '../types';

export const checklistService = {
  getByTicket: async (ticketId: number): Promise<ChecklistItem[]> => {
    const res = await api.get<ChecklistItem[]>(ENDPOINTS.tickets.checklist(ticketId));
    return res.data;
  },

  crearItem: async (ticketId: number, contenido: string): Promise<ChecklistItem> => {
    const res = await api.post<ChecklistItem>(ENDPOINTS.tickets.checklist(ticketId), {
      texto: contenido,
      completado: false,
    });
    return res.data;
  },

  toggleCompletado: async (ticketId: number, itemId: number): Promise<ChecklistItem> => {
    const res = await api.put<ChecklistItem>(ENDPOINTS.tickets.checklistToggle(ticketId, itemId));
    return res.data;
  },

  eliminarItem: async (ticketId: number, itemId: number): Promise<void> => {
    await api.delete(ENDPOINTS.tickets.checklistItem(ticketId, itemId));
  },

  reordenar: async (ticketId: number, orderedIds: number[]): Promise<void> => {
    await api.put(ENDPOINTS.tickets.checklistReordenar(ticketId), orderedIds);
  },
};

export const notaService = {
  getByTicket: async (ticketId: number): Promise<NotaTarea[]> => {
    const res = await api.get<any[]>(ENDPOINTS.tickets.notas(ticketId));
    return res.data.map((n) => ({
      id: n.id,
      contenido: n.texto,
      fechaCreacion: n.fechaHora,
      ticketId,
    }));
  },

  crearNota: async (ticketId: number, contenido: string): Promise<NotaTarea> => {
    const res = await api.post<any>(ENDPOINTS.tickets.notas(ticketId), { texto: contenido });
    return { id: res.data.id, contenido: res.data.texto, fechaCreacion: res.data.fechaHora, ticketId };
  },

  actualizarNota: async (ticketId: number, notaId: number, contenido: string): Promise<NotaTarea> => {
    const res = await api.put<any>(ENDPOINTS.tickets.nota(ticketId, notaId), { texto: contenido });
    return { id: res.data.id, contenido: res.data.texto, fechaCreacion: res.data.fechaHora, ticketId };
  },

  eliminarNota: async (ticketId: number, notaId: number): Promise<void> => {
    await api.delete(ENDPOINTS.tickets.nota(ticketId, notaId));
  },
};

export const recordatorioService = {
  getByTicket: async (ticketId: number): Promise<Recordatorio[]> => {
    const res = await api.get<Recordatorio[]>(ENDPOINTS.tickets.recordatorios(ticketId));
    return res.data;
  },

  crearRecordatorio: async (ticketId: number, fechaHora?: string, tipoRecordatorio?: string): Promise<Recordatorio> => {
    const res = await api.post<Recordatorio>(ENDPOINTS.tickets.recordatorios(ticketId), {
      tipo: tipoRecordatorio ? tipoRecordatorio.toUpperCase() : 'PERSONALIZADO',
      fechaPersonalizada: fechaHora || undefined,
    });
    return res.data;
  },

  eliminarRecordatorio: async (ticketId: number, recordatorioId: number): Promise<void> => {
    await api.delete(ENDPOINTS.tickets.recordatorio(ticketId, recordatorioId));
  },
};

export const adjuntoService = {
  getByTicket: async (ticketId: number): Promise<Adjunto[]> => {
    const res = await api.get<any[]>(ENDPOINTS.tickets.adjuntos(ticketId));
    return res.data.map((a) => ({
      id: a.id,
      nombreArchivo: a.nombre || a.url,
      rutaArchivo: a.url,
      url: a.url,
      tipoAdjunto: a.tipo ? (a.tipo.toUpperCase() as any) : 'ENLACE',
      fechaCreacion: a.fechaSubida,
      ticketId,
    }));
  },

  subirArchivo: async (ticketId: number, file: File): Promise<Adjunto> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<any>(ENDPOINTS.tickets.adjuntoArchivo(ticketId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return {
      id: res.data.id,
      nombreArchivo: res.data.nombre || res.data.url,
      rutaArchivo: res.data.url,
      url: res.data.url,
      tipoAdjunto: res.data.tipo ? (res.data.tipo.toUpperCase() as any) : 'ARCHIVO',
      fechaCreacion: res.data.fechaSubida,
      ticketId,
    };
  },

  crearEnlace: async (ticketId: number, url: string, nombre?: string): Promise<Adjunto> => {
    const res = await api.post<any>(ENDPOINTS.tickets.adjuntoEnlace(ticketId), { url, nombre });
    return {
      id: res.data.id,
      nombreArchivo: res.data.nombre || res.data.url,
      rutaArchivo: res.data.url,
      url: res.data.url,
      tipoAdjunto: res.data.tipo ? (res.data.tipo.toUpperCase() as any) : 'ENLACE',
      fechaCreacion: res.data.fechaSubida,
      ticketId,
    };
  },

  eliminarAdjunto: async (ticketId: number, adjuntoId: number): Promise<void> => {
    await api.delete(ENDPOINTS.tickets.adjunto(ticketId, adjuntoId));
  },
};

export const vinculoService = {
  getByTicket: async (ticketId: number): Promise<VinculoDTO[]> => {
    const res = await api.get<VinculoDTO[]>(ENDPOINTS.vinculos.byTicket(ticketId));
    return res.data;
  },

  crearVinculo: async (ticketOrigenId: number, ticketDestinoId: number, tipoVinculo = 'RELACIONADO_CON'): Promise<VinculoDTO> => {
    const res = await api.post<VinculoDTO>(ENDPOINTS.vinculos.create, {
      ticketOrigenId,
      ticketDestinoId,
      tipoVinculo,
    });
    return res.data;
  },

  eliminarVinculo: async (id: number): Promise<void> => {
    await api.delete(ENDPOINTS.vinculos.delete(id));
  },
};

export const usuarioService = {
  getAll: async () => {
    const res = await api.get<any[]>(ENDPOINTS.usuarios.list);
    return res.data;
  },
};
