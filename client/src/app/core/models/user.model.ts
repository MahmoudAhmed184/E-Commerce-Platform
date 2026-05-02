export interface User {
  id: string;
  email: string;
  phone: string | null;
  full_name: string;
  role: 'CUSTOMER' | 'ADMIN';
  status: 'PENDING' | 'ACTIVE' | 'RESTRICTED' | 'DELETED';
}

export interface AuthTokens {
  access: string;
  refresh: string;
  user: User;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  phone?: string;
  password: string;
  full_name: string;
}
