import type {
  GigDisputeStatus,
  GigDisputeType,
  GigFinishRequestStatus,
  GigPaymentStatus,
  GigStatus,
} from '@/types/enum';
import type { Gig, Paginated } from './types';

export type HistoryPerson = {
  id: number;
  name: string;
  avatar_url: string;
  location: string | null;
};

export type HistorySettlement = {
  outcome: string;
  total_amount?: number;
  freelancer_payout: number;
  client_refund: number;
  recorded_at?: string;
};

export type HistorySummary = {
  id: number;
  title: string;
  status: GigStatus;
  terminal_at: string | null;
  counterpart: HistoryPerson | null;
  settlement: HistorySettlement | null;
  viewer_has_rated: boolean;
  counterpart_has_rated: boolean;
};

export type HistoryRating = {
  id: number;
  score: number;
  comment: string | null;
  created_at: string;
  rater: Pick<HistoryPerson, 'id' | 'name' | 'avatar_url'>;
  recipient_id: number;
};

export type HistoryAgreement = {
  id: number;
  accepted_fee: number;
  final_scope: string | null;
  work_date: string | null;
  start_time: string | null;
  location_arrangement: string | null;
  delivery_expectations: string | null;
  final_total_price: number | null;
  terms_version: number;
  submitted_at: string | null;
  freelancer_confirmed_at: string | null;
  closed_at: string | null;
  closure_reason: string | null;
};

export type HistoryPayment = {
  id: number;
  amount: number;
  currency: string;
  status: GigPaymentStatus;
  provider: string;
  paid_at: string | null;
  cancelled_at: string | null;
  expired_at: string | null;
};

export type HistoryExitRequest = {
  id: number;
  type: string;
  reason: string;
  status: string;
  response: string | null;
  execution_mode: string | null;
  responded_at: string | null;
  withdrawn_at: string | null;
  executed_at: string | null;
};

export type HistoryFinishRequest = {
  id: number;
  status: GigFinishRequestStatus;
  completion_note: string;
  review_due_at: string;
  accepted_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  media: Array<{ id: number; url: string }>;
};

export type HistoryDispute = {
  id: number;
  type: GigDisputeType;
  status: GigDisputeStatus;
  opened_at: string;
  counterproof_due_at: string;
  finding: string | null;
  resolution_note: string | null;
  resolved_at: string | null;
  finish_request?: HistoryFinishRequest | null;
  submissions: Array<{
    id: number;
    type: string;
    statement: string;
    submitted_at: string;
    media: Array<{ id: number; url: string }>;
  }>;
};

export type HistoryIndexProps = {
  gigs: Paginated<HistorySummary>;
  filters: { status: string };
};

export type HistoryShowProps = {
  gig: Gig;
  counterpart: HistoryPerson | null;
  agreements: HistoryAgreement[];
  payments: HistoryPayment[];
  exit_requests: HistoryExitRequest[];
  finish_requests: HistoryFinishRequest[];
  settlement: HistorySettlement | null;
  dispute: HistoryDispute | null;
  ratings: HistoryRating[];
  terminal_at: string | null;
  capabilities: { canRate: boolean };
};
