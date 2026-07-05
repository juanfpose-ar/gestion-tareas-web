import { create } from 'zustand';
import type { Ticket } from '../types';

export type ModalType =
  | 'tablero'
  | 'ticket'
  | 'estado'
  | 'etiqueta'
  | 'users'
  | 'ticketDetail'
  | 'deleteEstado'
  | null;

interface UiState {
  activeModal: ModalType;
  selectedTicket: Ticket | null;
  initialTicketEstadoId: number | null;
  selectedEstadoNombre: string | null;
  tablerosExpanded: boolean;
  sidebarCollapsed: boolean;

  openModal: (modal: ModalType, opts?: { ticket?: Ticket; estadoId?: number; estadoNombre?: string }) => void;
  closeModal: () => void;
  setSelectedTicket: (ticket: Ticket | null) => void;
  setTablerosExpanded: (v: boolean) => void;
  setSidebarCollapsed: (v: boolean) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  activeModal: null,
  selectedTicket: null,
  initialTicketEstadoId: null,
  selectedEstadoNombre: null,
  tablerosExpanded: true,
  sidebarCollapsed: false,

  openModal: (modal, opts) =>
    set({
      activeModal: modal,
      selectedTicket: opts?.ticket ?? null,
      initialTicketEstadoId: opts?.estadoId ?? null,
      selectedEstadoNombre: opts?.estadoNombre ?? null,
    }),

  closeModal: () =>
    set({ activeModal: null, selectedTicket: null, initialTicketEstadoId: null, selectedEstadoNombre: null }),

  setSelectedTicket: (ticket) => set({ selectedTicket: ticket }),
  setTablerosExpanded: (v) => set({ tablerosExpanded: v }),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
}));
