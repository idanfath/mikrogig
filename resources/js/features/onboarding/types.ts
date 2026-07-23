import type { Auth } from '@/types/auth';

export type OnboardingAvatarPageProps = {
  auth: Auth;
};

export type OnboardingProfilePageProps = OnboardingAvatarPageProps & {
  max_date_of_birth?: string;
};
