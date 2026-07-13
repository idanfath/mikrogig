import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import AuthLayout from '@/layout/AuthLayout';
import password from '@/routes/password';
import { Form, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';

const PasswordReset = () => {

  const id = usePage().props.id as number;


  return (
    <>
      {/* Action placeholder as the route doesn't exist yet */}
      <Form action={password.reset.submit.url({ id })} method="post" className="w-full max-w-xl p-6">
        {({ errors, processing }) => (
          <>
            {/* Token should be handled here, typically passed via props from the controller */}
            <input type="hidden" name="token" value="" />

            <Field className="mb-4" data-invalid={!!errors.password}>
              <FieldLabel htmlFor="password">Password Baru</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
              />
              <FieldDescription>
                {errors.password ? (
                  <span className="text-destructive capitalize">{errors.password}</span>
                ) : 'Masukkan password baru Anda.'}
              </FieldDescription>
            </Field>

            <Field className="mb-4" data-invalid={!!errors.password_confirmation}>
              <FieldLabel htmlFor="password_confirmation">Konfirmasi Password Baru</FieldLabel>
              <Input
                id="password_confirmation"
                name="password_confirmation"
                type="password"
                autoComplete="new-password"
                required
              />
              <FieldDescription>
                {errors.password_confirmation ? (
                  <span className="text-destructive capitalize">{errors.password_confirmation}</span>
                ) : 'Ulangi password baru Anda.'}
              </FieldDescription>
            </Field>

            <Button type="submit" className="w-full" disabled={processing}>
              {processing ? 'Memproses...' : 'Reset Password'}
            </Button>
          </>
        )}
      </Form>
    </>
  );
};

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
