import type { UserRole } from './enum';

export type User = {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  avatar_url?: string;
  email_verified_at: string | null;
  role: UserRole;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
  date_of_birth?: string | null;
  province_id?: string | null;
  regency_id?: string | null;
  province_name?: string | null;
  regency_name?: string | null;
  location?: string | null;
};

export type Auth = {
  user: User;
};
