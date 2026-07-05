import { create } from 'zustand';
import type { ConversacionResumen } from '../types';
import { mensajeriaService } from '../services/mensajeriaService';

interface MensajeriaState {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  setUnreadFromConversaciones: (list: ConversacionResumen[]) => void;
}

const countUnread = (list: ConversacionResumen[]) =>
  list.filter((c) => !c.archivada && c.tieneNoLeidos).length;

export const useMensajeriaStore = create<MensajeriaState>((set) => ({
  unreadCount: 0,

  refreshUnreadCount: async () => {
    try {
      const data = await mensajeriaService.getBandeja();
      set({ unreadCount: countUnread(data) });
    } catch {
      // silencioso: se reintenta en el próximo poll
    }
  },

  setUnreadFromConversaciones: (list) => set({ unreadCount: countUnread(list) }),
}));
