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
  currentTenant: Tenant | null;
  isAuthenticated: boolean;
  setAuth: (user: User) => void;
  updateToken: (token: string, refreshToken?: string) => void;
  switchTenant: (tenant: Tenant) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  currentTenant: null,
  isAuthenticated: false,
  // Store only user and tenant client-side. Do NOT persist raw tokens client-side — backend uses httpOnly cookies.
  setAuth: (user) => set({ user, isAuthenticated: true, currentTenant: { id: user.tenantId, name: 'Personal' } }),
  // Keep updateToken as a no-op for compatibility with callers that may still invoke it.
  updateToken: () => undefined,
  switchTenant: (tenant) => set({ currentTenant: tenant }),
  logout: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
      window.sessionStorage.clear();
    }
    set({ user: null, isAuthenticated: false, currentTenant: null });
  },
}));