import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

interface AuthState {
  token: string | null;
  username: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      username: null,

      login: async (username, password) => {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        if (!res.ok) {
          const body = (await res.json()) as { error: string };
          throw new Error(body.error);
        }
        const { token, username: name } = (await res.json()) as { token: string; username: string };
        set({ token, username: name });
      },

      register: async (username, password) => {
        const res = await fetch(`${API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        if (!res.ok) {
          const body = (await res.json()) as { error: string };
          throw new Error(body.error);
        }
        const { token, username: name } = (await res.json()) as { token: string; username: string };
        set({ token, username: name });
      },

      logout: () => set({ token: null, username: null }),
    }),
    { name: 'auth-store', partialize: (s) => ({ token: s.token, username: s.username }) },
  ),
);
