import { create } from 'zustand';
import { clearAuthCookies, setAuthCookies } from './cookies';

type Role = 'admin' | 'user' | 'sme' | 'creator';

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantId: string;
}

interface Tenant {
  id: string;
  name: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  currentTenant: Tenant | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string, refreshToken: string) => void;
  updateToken: (token: string, refreshToken?: string) => void;
  switchTenant: (tenant: Tenant) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  currentTenant: null,
  isAuthenticated: false,
  setAuth: (user, token, refreshToken) => {
    setAuthCookies(token, refreshToken);
    set({ user, accessToken: token, refreshToken, isAuthenticated: true, currentTenant: { id: user.tenantId, name: 'Personal' } });
  },
  updateToken: (token, refreshToken) => set((state) => ({ accessToken: token, refreshToken: refreshToken || state.refreshToken })),
  switchTenant: (tenant) => set({ currentTenant: tenant }),
  logout: () => {
    clearAuthCookies();
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
      window.sessionStorage.clear();
    }
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, currentTenant: null });
  },
}));