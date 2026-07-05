import { create } from 'zustand';
import type { Tablero, EstadoTablero, Ticket, Etiqueta, TicketRequest, Version } from '../types';
import { tableroService } from '../services/tableroService';
import { estadoService } from '../services/estadoService';
import { ticketService } from '../services/ticketService';
import { etiquetaService } from '../services/etiquetaService';
import { versionService } from '../services/versionService';
import toast from 'react-hot-toast';

export interface EstadoRequest {
  nombre: string;
  colorHex?: string;
  orden: number;
  tableroId: number;
}

interface BoardState {
  boards: Tablero[];
  activeBoardId: number | null;
  estados: EstadoTablero[];
  tickets: Ticket[];
  etiquetas: Etiqueta[];
  versions: Version[];
  loading: boolean;

  loadBoards: () => Promise<void>;
  setActiveBoardId: (id: number) => void;
  loadBoardData: (boardId: number) => Promise<void>;
  reloadVersions: (boardId: number) => Promise<void>;

  createBoard: (nombre: string, descripcion?: string, imagenFondoUrl?: string) => Promise<Tablero>;
  createEstado: (data: EstadoRequest) => Promise<void>;
  updateEstado: (estadoId: number, nombre: string, colorHex: string) => Promise<void>;
  deleteEstado: (estadoId: number) => Promise<void>;
  createTicket: (data: TicketRequest) => Promise<void>;
  updateTicketEstado: (ticketId: number, estadoId: number) => Promise<void>;
  archiveTicket: (ticketId: number) => Promise<void>;
  reorderTicketsInEstado: (estadoId: number, orderedIds: number[]) => Promise<void>;
  reorderEstados: (newEstados: EstadoTablero[]) => Promise<void>;
  updateTicketLocal: (ticketId: number, fields: Partial<Ticket>) => void;
}

export const useBoardStore = create<BoardState>()((set, get) => ({
  boards: [],
  activeBoardId: null,
  estados: [],
  tickets: [],
  etiquetas: [],
  versions: [],
  loading: false,

  loadBoards: async () => {
    set({ loading: true });
    const boards = await tableroService.getMisTableros();
    set((s) => ({
      boards,
      loading: false,
      activeBoardId: s.activeBoardId ?? (boards.length > 0 ? boards[0].id : null),
    }));
  },

  setActiveBoardId: (id) => set({ activeBoardId: id }),

  loadBoardData: async (boardId) => {
    set({ loading: true });
    try {
      const [estados, tickets, etiquetas, versions] = await Promise.all([
        estadoService.getEstadosByTablero(boardId),
        ticketService.getTicketsByTablero(boardId),
        etiquetaService.getEtiquetasByTablero(boardId),
        versionService.getByTablero(boardId),
      ]);
      set({ estados, tickets, etiquetas, versions, loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  reloadVersions: async (boardId) => {
    const versions = await versionService.getByTablero(boardId);
    set({ versions });
  },

  createBoard: async (nombre, descripcion, imagenFondoUrl) => {
    const newBoard = await tableroService.crearTablero(nombre, descripcion, imagenFondoUrl);
    await get().loadBoards();
    set({ activeBoardId: newBoard.id });
    return newBoard;
  },

  createEstado: async (data) => {
    await estadoService.crearEstado(data);
    const { activeBoardId } = get();
    if (activeBoardId) await get().loadBoardData(activeBoardId);
  },

  deleteEstado: async (estadoId) => {
    await estadoService.eliminarEstado(estadoId);
    const { activeBoardId } = get();
    if (activeBoardId) await get().loadBoardData(activeBoardId);
  },

  updateEstado: async (estadoId, nombre, colorHex) => {
    const estado = get().estados.find((e) => e.id === estadoId);
    if (!estado) return;
    const updated = await estadoService.actualizarEstado(estadoId, {
      nombre,
      colorHex,
      orden: estado.orden,
      tableroId: estado.tableroId,
    });
    set((s) => ({
      estados: s.estados.map((e) => (e.id === estadoId ? { ...e, ...updated } : e)),
    }));
  },

  createTicket: async (data) => {
    await ticketService.crearTicket(data);
    const { activeBoardId } = get();
    if (activeBoardId) await get().loadBoardData(activeBoardId);
  },

  archiveTicket: async (ticketId) => {
    set((s) => ({ tickets: s.tickets.filter((t) => t.id !== ticketId) }));
    try {
      await ticketService.archivarTicket(ticketId);
    } catch {
      const { activeBoardId } = get();
      if (activeBoardId) await get().loadBoardData(activeBoardId);
    }
  },

  updateTicketEstado: async (ticketId, estadoId) => {
    const ticket = get().tickets.find((t) => t.id === ticketId);
    if (ticket && !ticket.fechaVencimiento) {
      toast.error('No se puede cambiar el estado de un ticket sin fecha de vencimiento');
      return;
    }
    if (ticket && !ticket.versionId) {
      toast.error('No se puede cambiar el estado de un ticket sin versión asignada');
      return;
    }
    // Actualización optimista en el frontend
    set((s) => {
      const estado = s.estados.find(e => e.id === estadoId);
      return {
        tickets: s.tickets.map((t) =>
          t.id === ticketId
            ? { ...t, estadoId, estadoNombre: estado?.nombre ?? t.estadoNombre, estadoColorHex: estado?.colorHex ?? t.estadoColorHex }
            : t
        ),
      };
    });
    try {
      await ticketService.cambiarEstado(ticketId, estadoId);
      const { activeBoardId } = get();
      if (activeBoardId) await get().loadBoardData(activeBoardId);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'No se pudo cambiar el estado del ticket';
      toast.error(msg);
      const { activeBoardId } = get();
      if (activeBoardId) await get().loadBoardData(activeBoardId);
    }
  },

  reorderTicketsInEstado: async (estadoId, orderedIds) => {
    set((s) => {
      const others = s.tickets.filter((t) => t.estadoId !== estadoId);
      const colMap = new Map(s.tickets.filter((t) => t.estadoId === estadoId).map((t) => [t.id, t]));
      const reordered = orderedIds
        .map((id, i) => {
          const t = colMap.get(id);
          return t ? ({ ...t, orden: i + 1 } as Ticket) : null;
        })
        .filter((t): t is Ticket => t !== null);
      return { tickets: [...others, ...reordered] };
    });
    try {
      await ticketService.reordenarEnEstado(estadoId, orderedIds);
    } catch {
      const { activeBoardId } = get();
      if (activeBoardId) await get().loadBoardData(activeBoardId);
    }
  },

  reorderEstados: async (newEstados) => {
    // Actualización optimista de columnas con sus nuevos órdenes numéricos
    const updatedWithOrden = newEstados.map((e, index) => ({ ...e, orden: index + 1 }));
    set({ estados: updatedWithOrden });

    try {
      await Promise.all(
        updatedWithOrden.map((e) =>
          estadoService.actualizarEstado(e.id, {
            nombre: e.nombre,
            colorHex: e.colorHex,
            orden: e.orden,
            tableroId: e.tableroId,
          })
        )
      );
    } catch {
      const { activeBoardId } = get();
      if (activeBoardId) await get().loadBoardData(activeBoardId);
    }
  },

  updateTicketLocal: (ticketId, fields) => {
    set((s) => ({
      tickets: s.tickets.map((t) => (t.id === ticketId ? { ...t, ...fields } : t)),
    }));
  },
}));
