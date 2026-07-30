export const GigAgreementClosureReason = {
  FreelancerDeclined: 'freelancer_declined',
  FreelancerLeft: 'freelancer_left',
  ClientRejected: 'client_rejected',
  GigCancelled: 'gig_cancelled',
} as const;
export type GigAgreementClosureReason =
  (typeof GigAgreementClosureReason)[keyof typeof GigAgreementClosureReason];

export const GigCategory = {
  Labor: 'labor',
  Cleaning: 'cleaning',
  Moving: 'moving',
  Construction: 'construction',
  Security: 'security',
} as const;
export type GigCategory = (typeof GigCategory)[keyof typeof GigCategory];

export const GigCategoryFrontendLabel = {
  labor: 'Tenaga Kerja',
  cleaning: 'Pembersihan',
  moving: 'Pindahan',
  construction: 'Konstruksi',
  security: 'Keamanan',
} as const;
export type GigCategoryFrontendLabel =
  (typeof GigCategoryFrontendLabel)[keyof typeof GigCategoryFrontendLabel];

export const GigEstimatedDuration = {
  UnderOneHour: 'under_1_hour',
  OneToTwoHours: '1_2_hours',
  TwoToFourHours: '2_4_hours',
  FourToSixHours: '4_6_hours',
  SixToEightHours: '6_8_hours',
  OneToTwoDays: '1_2_days',
  ThreeToFiveDays: '3_5_days',
} as const;
export type GigEstimatedDuration =
  (typeof GigEstimatedDuration)[keyof typeof GigEstimatedDuration];

export const GigEstimatedDurationFrontendLabel = {
  under_1_hour: 'Kurang dari 1 jam',
  '1_2_hours': '1–2 jam',
  '2_4_hours': '2–4 jam',
  '4_6_hours': '4–6 jam',
  '6_8_hours': '6–8 jam',
  '1_2_days': '1–2 hari',
  '3_5_days': '3–5 hari',
} as const;

export const WageBenchmarkStatus = {
  Below: 'below',
  Within: 'within',
  Meets: 'meets',
} as const;
export type WageBenchmarkStatus =
  (typeof WageBenchmarkStatus)[keyof typeof WageBenchmarkStatus];

export const WageBenchmarkStatusFrontendLabel = {
  below: 'Di bawah acuan',
  within: 'Dalam rentang',
  meets: 'Acuan terpenuhi',
} as const;

export const GigOfferStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
  AUTO_WITHDRAWN: 'auto_withdrawn',
} as const;
export type GigOfferStatus =
  (typeof GigOfferStatus)[keyof typeof GigOfferStatus];

export const GigOfferStatusFrontendLabel = {
  pending: 'Menunggu Tanggapan',
  accepted: 'Diterima',
  rejected: 'Ditolak',
  withdrawn: 'Ditarik',
  auto_withdrawn: 'Ditarik Otomatis',
} as const;
export type GigOfferStatusFrontendLabel =
  (typeof GigOfferStatusFrontendLabel)[keyof typeof GigOfferStatusFrontendLabel];

export const GigPaymentStatus = {
  Pending: 'pending',
  Paid: 'paid',
  Cancelled: 'cancelled',
  Expired: 'expired',
} as const;
export type GigPaymentStatus =
  (typeof GigPaymentStatus)[keyof typeof GigPaymentStatus];

export const GigExitType = {
  ClientCancellation: 'client_cancellation',
  FreelancerAbandonment: 'freelancer_abandonment',
} as const;
export type GigExitType = (typeof GigExitType)[keyof typeof GigExitType];

export const GigExitStatus = {
  Pending: 'pending',
  Refused: 'refused',
  Withdrawn: 'withdrawn',
  Executed: 'executed',
} as const;
export type GigExitStatus = (typeof GigExitStatus)[keyof typeof GigExitStatus];

export const GigExitDecision = { Agree: 'agree', Refuse: 'refuse' } as const;
export type GigExitDecision =
  (typeof GigExitDecision)[keyof typeof GigExitDecision];

export const GigExitExecutionMode = {
  Agreed: 'agreed',
  Unilateral: 'unilateral',
} as const;
export type GigExitExecutionMode =
  (typeof GigExitExecutionMode)[keyof typeof GigExitExecutionMode];

export const GigDisputeType = {
  NoShow: 'no_show',
  StartBlocked: 'start_blocked',
  WorkObstruction: 'work_obstruction',
  FinishRejected: 'finish_rejected',
} as const;
export type GigDisputeType =
  (typeof GigDisputeType)[keyof typeof GigDisputeType];

export const GigDisputeStatus = {
  AwaitingCounterproof: 'awaiting_counterproof',
  AwaitingAdmin: 'awaiting_admin',
  Resolved: 'resolved',
} as const;
export type GigDisputeStatus =
  (typeof GigDisputeStatus)[keyof typeof GigDisputeStatus];

export const GigDisputeAiOverviewStatus = {
  Queued: 'queued',
  Processing: 'processing',
  Completed: 'completed',
  Failed: 'failed',
} as const;
export type GigDisputeAiOverviewStatus =
  (typeof GigDisputeAiOverviewStatus)[keyof typeof GigDisputeAiOverviewStatus];

export const GigDisputeSubmissionType = {
  Report: 'report',
  Counterproof: 'counterproof',
} as const;
export type GigDisputeSubmissionType =
  (typeof GigDisputeSubmissionType)[keyof typeof GigDisputeSubmissionType];

export const GigDisputeFinding = {
  ClientAtFault: 'client_at_fault',
  FreelancerAtFault: 'freelancer_at_fault',
  Inconclusive: 'inconclusive',
} as const;
export type GigDisputeFinding =
  (typeof GigDisputeFinding)[keyof typeof GigDisputeFinding];

export const GigDisputeFindingFrontendLabel = {
  client_at_fault: 'Klien Bersalah',
  freelancer_at_fault: 'Pekerja Bersalah',
  inconclusive: 'Tidak Meyakinkan',
} as const;
export type GigDisputeFindingFrontendLabel =
  (typeof GigDisputeFindingFrontendLabel)[keyof typeof GigDisputeFindingFrontendLabel];

export const GigFinishRequestStatus = {
  Pending: 'pending',
  Accepted: 'accepted',
  Rejected: 'rejected',
  AutoAccepted: 'auto_accepted',
} as const;
export type GigFinishRequestStatus =
  (typeof GigFinishRequestStatus)[keyof typeof GigFinishRequestStatus];

export const GigMessageKind = {
  User: 'user',
  System: 'system',
} as const;
export type GigMessageKind =
  (typeof GigMessageKind)[keyof typeof GigMessageKind];

export const NotificationCategory = {
  System: 'system',
  Chat: 'chat',
} as const;
export type NotificationCategory =
  (typeof NotificationCategory)[keyof typeof NotificationCategory];

export const NotificationCategoryFrontendLabel = {
  system: 'Aktivitas',
  chat: 'Pesan',
} as const;

export function getNotificationCategoryLabel(category?: string | null): string {
  return (
    NotificationCategoryFrontendLabel[
      category as keyof typeof NotificationCategoryFrontendLabel
    ] ?? category ?? ''
  );
}

export const GigWorkflowEvent = {
  FreelancerSelected: 'freelancer_selected',
  AgreementTermsSubmitted: 'agreement_terms_submitted',
  AgreementChangesRequested: 'agreement_changes_requested',
  AgreementAccepted: 'agreement_accepted',
  AgreementDeclined: 'agreement_declined',
  FreelancerLeft: 'freelancer_left',
  SelectedFreelancerRejected: 'selected_freelancer_rejected',
  PaymentPending: 'payment_pending',
  PaymentConfirmed: 'payment_confirmed',
  PaymentCancelled: 'payment_cancelled',
  PaymentExpired: 'payment_expired',
  WorkStarted: 'work_started',
  ExitRequested: 'exit_requested',
  ExitAccepted: 'exit_accepted',
  ExitRefused: 'exit_refused',
  ExitWithdrawn: 'exit_withdrawn',
  ExitProceeded: 'exit_proceeded',
  FinishSubmitted: 'finish_submitted',
  FinishRejected: 'finish_rejected',
  GigCompleted: 'gig_completed',
  DisputeOpened: 'dispute_opened',
  CounterproofSubmitted: 'counterproof_submitted',
  DisputeResolved: 'dispute_resolved',
  GigCancelled: 'gig_cancelled',
} as const;
export type GigWorkflowEvent =
  (typeof GigWorkflowEvent)[keyof typeof GigWorkflowEvent];

export const GigSettlementOutcome = {
  FullClientRefund: 'full_client_refund',
  ThirtySeventy: 'thirty_seventy',
  FullFreelancerPayout: 'full_freelancer_payout',
} as const;
export type GigSettlementOutcome =
  (typeof GigSettlementOutcome)[keyof typeof GigSettlementOutcome];

export const GigPaymentStatusFrontendLabel = {
  pending: 'Menunggu Pembayaran',
  paid: 'Dibayar',
  cancelled: 'Dibatalkan',
  expired: 'Kedaluwarsa',
} as const;
export type GigPaymentStatusFrontendLabel =
  (typeof GigPaymentStatusFrontendLabel)[keyof typeof GigPaymentStatusFrontendLabel];

export const GigStatus = {
  Open: 'open',
  AgreementPreparation: 'agreement_preparation',
  LockPending: 'lock_pending',
  PaymentPending: 'payment_pending',
  Locked: 'locked',
  InProgress: 'in_progress',
  Review: 'review',
  Completed: 'completed',
  Cancelled: 'cancelled',
  Disputed: 'disputed',
  DisputeResolved: 'dispute_resolved',
} as const;
export type GigStatus = (typeof GigStatus)[keyof typeof GigStatus];

export const GigStatusFrontendLabel = {
  open: 'Terbuka',
  agreement_preparation: 'Persiapan Persetujuan',
  lock_pending: 'Menunggu Kunci',
  payment_pending: 'Menunggu Pembayaran',
  locked: 'Terkunci',
  in_progress: 'Dalam Pengerjaan',
  review: 'Ditinjau',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
  disputed: 'Sengketa',
  dispute_resolved: 'Sengketa Selesai',
} as const;
export type GigStatusFrontendLabel =
  (typeof GigStatusFrontendLabel)[keyof typeof GigStatusFrontendLabel];

export const NotificationTargetType = {
  Everyone: 'everyone',
  Role: 'role',
  Users: 'users',
  User: 'user',
} as const;
export type NotificationTargetType =
  (typeof NotificationTargetType)[keyof typeof NotificationTargetType];

export const OnboardingStep = {
  PickRole: 'pick_role',
  SetupAvatar: 'setup_avatar',
  Profile: 'profile',
} as const;
export type OnboardingStep =
  (typeof OnboardingStep)[keyof typeof OnboardingStep];

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

export function getUserRoleLabel(role?: string | null): string {
  if (!role) {
    return '';
  }

  return (
    UserRoleFrontendLabel[role as keyof typeof UserRoleFrontendLabel] ?? role
  );
}

export function getGigCategoryLabel(category?: string | null): string {
  if (!category) {
    return '';
  }

  return (
    GigCategoryFrontendLabel[
      category as keyof typeof GigCategoryFrontendLabel
    ] ?? category
  );
}

export function getGigEstimatedDurationLabel(
  duration?: string | null,
): string {
  if (!duration) {
    return '';
  }

  return (
    GigEstimatedDurationFrontendLabel[
      duration as keyof typeof GigEstimatedDurationFrontendLabel
    ] ?? duration
  );
}

export function getWageBenchmarkStatusLabel(
  status?: string | null,
): string {
  if (!status) {
    return '';
  }

  return (
    WageBenchmarkStatusFrontendLabel[
      status as keyof typeof WageBenchmarkStatusFrontendLabel
    ] ?? status
  );
}

export function getWageBenchmarkStatusVariant(
  status?: string | null,
): 'success' | 'warning' | 'destructive' | 'secondary' {
  switch (status) {
    case WageBenchmarkStatus.Meets:
      return 'success';
    case WageBenchmarkStatus.Within:
      return 'warning';
    case WageBenchmarkStatus.Below:
      return 'destructive';
    default:
      return 'secondary';
  }
}

export function getGigStatusLabel(status?: string | null): string {
  if (!status) {
    return '';
  }

  return (
    GigStatusFrontendLabel[status as keyof typeof GigStatusFrontendLabel] ??
    status
  );
}

export function getGigStatusVariant(
  status: string,
): 'success' | 'secondary' | 'warning' | 'destructive' {
  switch (status) {
    case GigStatus.Open:
    case GigStatus.Completed:
      return 'success';
    case GigStatus.AgreementPreparation:
    case GigStatus.LockPending:
    case GigStatus.PaymentPending:
    case GigStatus.Locked:
    case GigStatus.InProgress:
    case GigStatus.Review:
      return 'secondary';
    case GigStatus.Disputed:
      return 'warning';
    case GigStatus.Cancelled:
    case GigStatus.DisputeResolved:
      return 'destructive';
    default:
      return 'secondary';
  }
}

export function getGigOfferStatusVariant(
  status: string,
): 'success' | 'secondary' | 'warning' | 'destructive' {
  switch (status) {
    case GigOfferStatus.ACCEPTED:
      return 'success';
    case GigOfferStatus.PENDING:
      return 'warning';
    case GigOfferStatus.WITHDRAWN:
    case GigOfferStatus.AUTO_WITHDRAWN:
      return 'secondary';
    case GigOfferStatus.REJECTED:
      return 'destructive';
    default:
      return 'secondary';
  }
}

export function getGigOfferStatusLabel(status?: string | null): string {
  if (!status) {
    return '';
  }

  return (
    GigOfferStatusFrontendLabel[
      status as keyof typeof GigOfferStatusFrontendLabel
    ] ?? status
  );
}

export function getGigPaymentStatusLabel(status?: string | null): string {
  if (!status) {
    return '';
  }

  return (
    GigPaymentStatusFrontendLabel[
      status as keyof typeof GigPaymentStatusFrontendLabel
    ] ?? status
  );
}

export function getGigPaymentStatusVariant(
  status?: string | null,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case GigPaymentStatus.Paid:
      return 'default';
    case GigPaymentStatus.Pending:
      return 'secondary';
    case GigPaymentStatus.Cancelled:
    case GigPaymentStatus.Expired:
      return 'destructive';
    default:
      return 'outline';
  }
}

export function getGigExitStatusLabel(status?: string | null): string {
  return (
    (
      {
        pending: 'Menunggu respons',
        refused: 'Ditolak',
        withdrawn: 'Ditarik',
        executed: 'Dieksekusi',
      } as Record<string, string>
    )[status ?? ''] ??
    status ??
    ''
  );
}

export function getGigExitTypeLabel(type?: string | null): string {
  return (
    (
      {
        client_cancellation: 'Pembatalan klien',
        freelancer_abandonment: 'Pengunduran diri pekerja',
      } as Record<string, string>
    )[type ?? ''] ??
    type ??
    ''
  );
}

export function getGigExitDecisionLabel(decision?: string | null): string {
  return (
    ({ agree: 'Setuju', refuse: 'Tolak' } as Record<string, string>)[
      decision ?? ''
    ] ??
    decision ??
    ''
  );
}

export function getGigExitExecutionModeLabel(mode?: string | null): string {
  return (
    (
      { agreed: 'Disetujui bersama', unilateral: 'Sepihak' } as Record<
        string,
        string
      >
    )[mode ?? ''] ??
    mode ??
    ''
  );
}

export function getGigDisputeStatusLabel(status?: string | null): string {
  return (
    (
      {
        awaiting_counterproof: 'Menunggu counterproof',
        awaiting_admin: 'Menunggu admin',
        resolved: 'Selesai',
      } as Record<string, string>
    )[status ?? ''] ??
    status ??
    ''
  );
}

export function getGigDisputeAiOverviewStatusLabel(
  status?: string | null,
): string {
  return (
    (
      {
        queued: 'Dalam antrean',
        processing: 'Sedang dibuat',
        completed: 'Selesai',
        failed: 'Gagal',
      } as Record<string, string>
    )[status ?? ''] ??
    status ??
    ''
  );
}

export function getGigDisputeStatusVariant(
  status?: string | null,
): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'resolved':
      return 'secondary';
    case 'awaiting_counterproof':
      return 'destructive';
    case 'awaiting_admin':
      return 'default';
    default:
      return 'outline';
  }
}

export function getGigDisputeTypeLabel(type?: string | null): string {
  return (
    (
      {
        no_show: 'Tidak hadir',
        start_blocked: 'Mulai kerja terhalang',
        work_obstruction: 'Penyelesaian kerja dihalangi',
        finish_rejected: 'Penyelesaian ditolak',
      } as Record<string, string>
    )[type ?? ''] ??
    type ??
    ''
  );
}

export function getGigFinishRequestStatusLabel(status?: string | null): string {
  return (
    (
      {
        pending: 'Menunggu tinjauan',
        accepted: 'Diterima',
        rejected: 'Ditolak',
        auto_accepted: 'Diterima otomatis',
      } as Record<string, string>
    )[status ?? ''] ??
    status ??
    ''
  );
}

export function getGigDisputeSubmissionTypeLabel(type?: string | null): string {
  return (
    (
      { report: 'Laporan', counterproof: 'Counterproof' } as Record<
        string,
        string
      >
    )[type ?? ''] ??
    type ??
    ''
  );
}

export function getGigDisputeFindingLabel(finding?: string | null): string {
  return finding && finding in GigDisputeFindingFrontendLabel
    ? GigDisputeFindingFrontendLabel[
        finding as keyof typeof GigDisputeFindingFrontendLabel
      ]
    : finding ?? '';
}

export function getGigSettlementOutcomeLabel(outcome?: string | null): string {
  return (
    (
      {
        full_client_refund: 'Refund penuh untuk klien',
        thirty_seventy: '30% pekerja, 70% klien',
        full_freelancer_payout: 'Payout penuh untuk pekerja',
      } as Record<string, string>
    )[outcome ?? ''] ??
    outcome ??
    ''
  );
}

export const GigWorkflowEventFrontendLabel = {
  freelancer_selected: 'Pekerja Dipilih',
  agreement_terms_submitted: 'Ketentuan Disampaikan',
  agreement_changes_requested: 'Perubahan Ketentuan Diajukan',
  agreement_accepted: 'Ketentuan Disetujui',
  agreement_declined: 'Ketentuan Ditolak',
  freelancer_left: 'Pekerja Mengundurkan Diri',
  selected_freelancer_rejected: 'Pekerja Ditolak',
  payment_pending: 'Menunggu Pembayaran',
  payment_confirmed: 'Pembayaran Dikonfirmasi',
  payment_cancelled: 'Pembayaran Dibatalkan',
  payment_expired: 'Pembayaran Kadaluarsa',
  work_started: 'Pekerjaan Dimulai',
  exit_requested: 'Permohonan Berhenti Diajukan',
  exit_accepted: 'Permohonan Berhenti Disetujui',
  exit_refused: 'Permohonan Berhenti Ditolak',
  exit_withdrawn: 'Permohonan Berhenti Ditarik',
  exit_proceeded: 'Permohonan Berhenti Diproses',
  finish_submitted: 'Hasil Pekerjaan Dikirim',
  finish_rejected: 'Hasil Pekerjaan Ditolak',
  gig_completed: 'Gig Selesai',
  dispute_opened: 'Sengketa Dibuka',
  counterproof_submitted: 'Bukti Balasan Dikirim',
  dispute_resolved: 'Sengketa Diselesaikan Admin',
  gig_cancelled: 'Gig Dibatalkan',
} as const;

export function getGigWorkflowEventLabel(event?: string | null): string {
  if (!event) {
    return '';
  }

  return (
    GigWorkflowEventFrontendLabel[
      event as keyof typeof GigWorkflowEventFrontendLabel
    ] ?? event
  );
}
