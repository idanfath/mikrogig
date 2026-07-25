export const GigAgreementClosureReason = {
  FreelancerDeclined: "freelancer_declined",
  FreelancerLeft: "freelancer_left",
  ClientRejected: "client_rejected",
  GigCancelled: "gig_cancelled",
} as const;
export type GigAgreementClosureReason = typeof GigAgreementClosureReason[keyof typeof GigAgreementClosureReason]

export const GigCategory = {
  Labor: "labor",
  Cleaning: "cleaning",
  Moving: "moving",
  Construction: "construction",
  Security: "security",
} as const;
export type GigCategory = typeof GigCategory[keyof typeof GigCategory]

export const GigCategoryFrontendLabel = {
  labor: "Tenaga Kerja",
  cleaning: "Pembersihan",
  moving: "Pindahan",
  construction: "Konstruksi",
  security: "Keamanan",
} as const;
export type GigCategoryFrontendLabel = typeof GigCategoryFrontendLabel[keyof typeof GigCategoryFrontendLabel]

export const GigOfferStatus = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  WITHDRAWN: "withdrawn",
  AUTO_WITHDRAWN: "auto_withdrawn",
} as const;
export type GigOfferStatus = typeof GigOfferStatus[keyof typeof GigOfferStatus]

export const GigOfferStatusFrontendLabel = {
  pending: "Menunggu Tanggapan",
  accepted: "Diterima",
  rejected: "Ditolak",
  withdrawn: "Ditarik",
  auto_withdrawn: "Ditarik Otomatis",
} as const;
export type GigOfferStatusFrontendLabel = typeof GigOfferStatusFrontendLabel[keyof typeof GigOfferStatusFrontendLabel]

export const GigStatus = {
  Open: "open",
  AgreementPreparation: "agreement_preparation",
  LockPending: "lock_pending",
  PaymentPending: "payment_pending",
  Locked: "locked",
  InProgress: "in_progress",
  Review: "review",
  Completed: "completed",
  Cancelled: "cancelled",
  Disputed: "disputed",
  DisputeResolved: "dispute_resolved",
} as const;
export type GigStatus = typeof GigStatus[keyof typeof GigStatus]

export const GigStatusFrontendLabel = {
  open: "Terbuka",
  agreement_preparation: "Persiapan Persetujuan",
  lock_pending: "Menunggu Kunci",
  payment_pending: "Menunggu Pembayaran",
  locked: "Terkunci",
  in_progress: "Dalam Pengerjaan",
  review: "Ditinjau",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  disputed: "Sengketa",
  dispute_resolved: "Sengketa Selesai",
} as const;
export type GigStatusFrontendLabel = typeof GigStatusFrontendLabel[keyof typeof GigStatusFrontendLabel]

export const NotificationTargetType = {
  Everyone: "everyone",
  Role: "role",
  Users: "users",
  User: "user",
} as const;
export type NotificationTargetType = typeof NotificationTargetType[keyof typeof NotificationTargetType]

export const OnboardingStep = {
  PickRole: "pick_role",
  SetupAvatar: "setup_avatar",
  Profile: "profile",
} as const;
export type OnboardingStep = typeof OnboardingStep[keyof typeof OnboardingStep]

export const UserRole = {
  Freelancer: "freelancer",
  Client: "client",
  Admin: "admin",
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole]

export const UserRoleFrontendLabel = {
  freelancer: "Pekerja",
  client: "Pemberi Kerja",
  admin: "Admin",
} as const;
export type UserRoleFrontendLabel = typeof UserRoleFrontendLabel[keyof typeof UserRoleFrontendLabel]

export function getUserRoleLabel(role?: string | null): string {
  if (!role) return '';
  return UserRoleFrontendLabel[role as keyof typeof UserRoleFrontendLabel] ?? role;
}

export function getGigCategoryLabel(category?: string | null): string {
  if (!category) return '';
  return GigCategoryFrontendLabel[category as keyof typeof GigCategoryFrontendLabel] ?? category;
}

export function getGigStatusLabel(status?: string | null): string {
  if (!status) return '';
  return GigStatusFrontendLabel[status as keyof typeof GigStatusFrontendLabel] ?? status;
}

export function getGigOfferStatusLabel(status?: string | null): string {
  if (!status) return '';
  return GigOfferStatusFrontendLabel[status as keyof typeof GigOfferStatusFrontendLabel] ?? status;
}
