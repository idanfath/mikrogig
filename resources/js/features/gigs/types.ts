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
  status: string;
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
  cancelled_at: string | null;
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

export type Paginated<T> = {
  data: T[];
  links: Array<{ url: string | null; label: string; active: boolean }>;
  meta?: { current_page: number; last_page: number };
};
