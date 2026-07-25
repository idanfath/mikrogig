export type GigMedia = {
  id: number;
  url: string;
};

export type GigClient = {
  id: number;
  name: string;
  avatar_url: string;
  location: string | null;
};

export type Gig = {
  id: number;
  title: string;
  description: string;
  category: string;
  status: GigStatus;
  province_id: string;
  regency_id: string;
  province_name: string;
  regency_name: string;
  location_address: string;
  location_latitude: string | null;
  location_longitude: string | null;
  location_accuracy_meters: number | null;
  work_date: string;
  start_time: string;
  posted_fee: number;
  created_at: string | null;
  updated_at: string | null;
  started_at: string | null;
  cancelled_at: string | null;
  completed_at: string | null;
  media: GigMedia[];
  client: GigClient;
  pending_applicants_count?: number;
};

export type Freelancer = {
  id: number;
  name: string;
  avatar_url: string;
  location: string | null;
  freelancer_profile?: {
    title: string | null;
    bio: string | null;
    skills: string[];
  };
};

export type GigOffer = {
  id: number;
  status: string;
  offered_fee: number;
  note: string | null;
  created_at: string | null;
  updated_at: string | null;
  gig?: Gig;
  freelancer?: Freelancer;
};

export type GigAgreement = {
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
  change_requested_at: string | null;
  freelancer_confirmed_at: string | null;
  latest_change_request_note: string | null;
};

export type GigAgreementCapabilities = {
  can_submit_terms: boolean;
  can_accept: boolean;
  can_request_changes: boolean;
  can_decline: boolean;
  can_leave: boolean;
  can_reject: boolean;
};

export type GigPaymentCapabilities = {
  can_open_checkout: boolean;
  can_retry_checkout: boolean;
  can_complete_mock_payment: boolean;
  can_cancel: boolean;
};

export type GigPayment = {
  id: number;
  amount: number;
  currency: 'IDR';
  local_reference: string;
  provider: string;
  provider_reference: string | null;
  checkout_url: string | null;
  status: GigPaymentStatus;
  expires_at: string;
  checkout_prepared_at: string | null;
  provider_paid_at: string | null;
  paid_at: string | null;
  cancelled_at: string | null;
  expired_at: string | null;
  capabilities: GigPaymentCapabilities;
};

export type GigPaymentSummary = {
  id: number;
  title: string;
  status: GigStatus;
};

export type Paginated<T> = {
  data: T[];
  links: Array<{ url: string | null; label: string; active: boolean }>;
  meta?: { current_page: number; last_page: number };
};
import type { GigPaymentStatus, GigStatus } from '@/types/enum';
