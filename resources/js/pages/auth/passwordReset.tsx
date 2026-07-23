import type { ReactNode } from 'react';
import { ResetPasswordForm } from '@/features/auth/components/reset-password-form';
import AuthLayout from '@/layout/AuthLayout';

interface PasswordResetPageProps {
  token: string;
  email: string;
}

const PasswordReset = ({ token, email }: PasswordResetPageProps) => (
  <ResetPasswordForm token={token} email={email} />
);

PasswordReset.layout = (page: ReactNode) => (
  <AuthLayout
    title="Reset Password"
    heading="Reset Password"
    description="Silakan masukkan password baru Anda di bawah ini."
  >
    {page}
  </AuthLayout>
);

export default PasswordReset;
