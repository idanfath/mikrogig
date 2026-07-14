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
    [key: string]: any; // This allows for additional properties...
};

export type Auth = {
    user: User;
};
