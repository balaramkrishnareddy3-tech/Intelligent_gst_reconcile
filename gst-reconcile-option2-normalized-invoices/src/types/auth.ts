export type UserRole = 'company' | 'vendor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyName: string;
  gstin: string;
  password?: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  role: UserRole;
  companyName: string;
  gstin?: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<boolean>;
  register: (input: RegisterInput) => Promise<{ success: boolean; message: string; user?: User }>;
  logout: () => void;
  checkAuth: () => void;
  getDashboardPath: (role: UserRole) => string;
}

export const DEMO_USERS: Record<UserRole, User> = {
  company: { id: 'comp-001', name: 'Rajesh Kumar', email: 'company@demo.com', role: 'company', companyName: 'Acme Corp India Pvt Ltd', gstin: '27AABCU9603R1ZM', password: 'company123' },
  vendor: { id: 'vend-001', name: 'Priya Sharma', email: 'vendor@demo.com', role: 'vendor', companyName: 'Vendor Supplies Co', gstin: '29GGGGG1314R9Z6', password: 'vendor123' },
  admin: { id: 'adm-001', name: 'System Administrator', email: 'admin@demo.com', role: 'admin', companyName: 'GST Reconcile Platform Ops', gstin: '27GSTADMIN0001Z1', password: 'admin123' },
};
