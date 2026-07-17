export const NotificationTargetType = {
  Everyone: 'everyone',
  Role: 'role',
  Users: 'users',
  User: 'user',
} as const;
export type NotificationTargetType =
  (typeof NotificationTargetType)[keyof typeof NotificationTargetType];

export const UserRole = {
  Freelancer: 'freelancer',
  Client: 'client',
  Admin: 'admin',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserRoleFrontendLabel = {
  freelancer: 'Pekerja',
  client: 'Pemberi Kerja',
  admin: 'Admin',
} as const;
export type UserRoleFrontendLabel =
  (typeof UserRoleFrontendLabel)[keyof typeof UserRoleFrontendLabel];
