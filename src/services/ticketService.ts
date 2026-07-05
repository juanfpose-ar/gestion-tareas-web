import api from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { Ticket, TicketRequest } from '../types';

export const ticketService = {
  getTicketsByTablero: async (tableroId: number): Promise<Ticket[]> => {
    const res = await api.get<Ticket[]>(ENDPOINTS.tickets.byTablero(tableroId));
    return res.data;
  },

  getArchivedByTablero: async (tableroId: number): Promise<Ticket[]> => {
    const res = await api.get<Ticket[]>(ENDPOINTS.tickets.archivadosByTablero(tableroId));
    return res.data;
  },

  getByVersion: async (versionId: number): Promise<Ticket[]> => {
    const res = await api.get<Ticket[]>(ENDPOINTS.tickets.byVersion(versionId));
    return res.data;
  },

  getTicketById: async (id: number): Promise<Ticket> => {
    const res = await api.get<Ticket>(ENDPOINTS.tickets.byId(id));
    return res.data;
  },

  crearTicket: async (req: TicketRequest): Promise<Ticket> => {
    const res = await api.post<Ticket>(ENDPOINTS.tickets.create, req);
    return res.data;
  },

  actualizarTicket: async (id: number, req: TicketRequest): Promise<Ticket> => {
    const res = await api.put<Ticket>(ENDPOINTS.tickets.update(id), req);
    return res.data;
  },

  cambiarEstado: async (ticketId: number, estadoId: number): Promise<Ticket> => {
    const res = await api.patch<Ticket>(`${ENDPOINTS.tickets.cambiarEstado(ticketId)}?nuevoEstadoId=${estadoId}`);
    return res.data;
  },

  archivarTicket: async (ticketId: number): Promise<Ticket> => {
    const res = await api.patch<Ticket>(`${ENDPOINTS.tickets.archivar(ticketId)}?archivado=true`);
    return res.data;
  },

  desarchivarTicket: async (ticketId: number): Promise<Ticket> => {
    const res = await api.patch<Ticket>(`${ENDPOINTS.tickets.archivar(ticketId)}?archivado=false`);
    return res.data;
  },

  cambiarCompletado: async (ticketId: number, completado: boolean): Promise<Ticket> => {
    const res = await api.patch<Ticket>(`${ENDPOINTS.tickets.cambiarCompletado(ticketId)}?completado=${completado}`);
    return res.data;
  },

  reordenarEnEstado: async (estadoId: number, orderedIds: number[]): Promise<void> => {
    await api.put(ENDPOINTS.tickets.reordenarEnEstado(estadoId), orderedIds);
  },

  eliminarTicket: async (id: number): Promise<void> => {
    await api.delete(ENDPOINTS.tickets.delete(id));
  },

  asignarUsuario: async (ticketId: number, usuarioId: number): Promise<Ticket> => {
    const res = await api.post<Ticket>(ENDPOINTS.tickets.asignar(ticketId, usuarioId));
    return res.data;
  },

  desasignarUsuario: async (ticketId: number, usuarioId: number): Promise<Ticket> => {
    const res = await api.delete<Ticket>(ENDPOINTS.tickets.desasignar(ticketId, usuarioId));
    return res.data;
  },

  asignarInformado: async (ticketId: number, usuarioId: number): Promise<Ticket> => {
    const res = await api.post<Ticket>(ENDPOINTS.tickets.asignarInformado(ticketId, usuarioId));
    return res.data;
  },

  desasignarInformado: async (ticketId: number, usuarioId: number): Promise<Ticket> => {
    const res = await api.delete<Ticket>(ENDPOINTS.tickets.desasignarInformado(ticketId, usuarioId));
    return res.data;
  },
};
