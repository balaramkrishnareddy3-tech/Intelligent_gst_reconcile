import { create } from 'zustand';
import type { AuthState, User, UserRole } from '@/types/auth';
import { DEMO_USERS } from '@/types/auth';

const AUTH_KEY = 'gst_reconcile_auth_v3';
const USERS_KEY = 'gst_reconcile_registered_users_v1';

function readRegisteredUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRegisteredUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function dashboardFor(role: UserRole) {
  return `/${role}/dashboard`;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string, role?: UserRole): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const normalizedEmail = email.trim().toLowerCase();
    const candidates = [
      ...Object.values(DEMO_USERS),
      ...readRegisteredUsers(),
    ];
    const user = candidates.find((item) =>
      item.email.toLowerCase() === normalizedEmail &&
      item.password === password.trim() &&
      (!role || item.role === role),
    );

    if (!user) return false;
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    set({ user, isAuthenticated: true, isLoading: false });
    return true;
  },

  register: async (input) => {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const email = input.email.trim().toLowerCase();
    const exists = [...Object.values(DEMO_USERS), ...readRegisteredUsers()].some(
      (item) => item.email.toLowerCase() === email,
    );
    if (exists) return { success: false, message: 'An account with this email already exists. Please sign in.' };

    const user: User = {
      id: `${input.role}-${Date.now()}`,
      name: input.name.trim(),
      email,
      role: input.role,
      companyName: input.companyName.trim(),
      gstin: input.gstin?.trim().toUpperCase() || 'DEMO-GSTIN',
      password: input.password,
    };
    saveRegisteredUsers([...readRegisteredUsers(), user]);
    return { success: true, message: 'Account created successfully. Please sign in.', user };
  },

  logout: () => {
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem('gst_reconcile_session');
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: () => {
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      if (stored) {
        const user = JSON.parse(stored) as User;
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      localStorage.removeItem(AUTH_KEY);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  getDashboardPath: (role: UserRole) => dashboardFor(role),
}));
