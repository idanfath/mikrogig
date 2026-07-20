import type { UserRole } from '@/types/enum';

export type FreelancerProfile = {
  title: string | null;
  bio: string | null;
  skills: string[];
};

export type Profile = {
  id: number;
  name: string;
  avatar_url: string;
  role: UserRole;
  location: string | null;
  freelancer_profile?: FreelancerProfile;
  email?: string;
  date_of_birth?: string | null;
  province_id?: string | null;
  regency_id?: string | null;
};

export type ProfileForm = {
  name: string;
  date_of_birth: string;
  province_id: string;
  regency_id: string;
  title: string;
  bio: string;
  skills: string[];
  avatar: File | null;
  remove_avatar: boolean;
};

export type ProfilePageProps = {
  profile: Profile;
  is_owner: boolean;
  has_custom_avatar: boolean;
  max_date_of_birth: string | null;
};
