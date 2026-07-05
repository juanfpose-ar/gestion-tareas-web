import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Usuario } from '../types';
import { authService } from '../services/authService';

interface AuthState {
  token: string | null;
  user: Usuario | null;
  login: (token: string, user: Usuario) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,

      login: (token, user) => set({ token, user }),

      logout: async () => {
        try {
          await authService.logout();
        } catch {
          // Si el backend falla, igual limpiamos el estado local
        } finally {
          set({ token: null, user: null });
        }
      },
    }),
    {
      name: 'gt-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
