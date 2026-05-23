export type UserRole = 'customer' | 'admin';
export type UserStatus = 'pending_approval' | 'active' | 'restricted' | 'soft_deleted';

export interface User {
  id: string;
  email: string;
  phone: string | null;
  full_name: string;
  role: UserRole;
  status: UserStatus;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  phone: string;
  password: string;
  full_name: string;
}
