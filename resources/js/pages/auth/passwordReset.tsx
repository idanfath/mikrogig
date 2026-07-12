import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import AuthLayout from '@/layout/AuthLayout';
import password from '@/routes/password';
import { Form, Head, usePage } from '@inertiajs/react';
import { ReactElement, ReactNode } from 'react';

type InertiaPageWithLayout = (() => ReactElement) & {
  layout?: (page: ReactNode) => ReactNode;
};

const PasswordReset: InertiaPageWithLayout = () => {

  const id = usePage().props.id as number;


  return (
    <div className="flex items-center justify-center h-screen flex-col ">
      <Head title="Reset Password" />
      <p className="text-2xl font-bold mb-2">Reset Password</p>
      <p className="text-muted-foreground text-center max-w-md px-6">
        Silakan masukkan password baru Anda di bawah ini.
      </p>

      {/* Action placeholder as the route doesn't exist yet */}
      <Form action={password.reset.submit.url({ id })} method="post" className="p-6 max-w-xl w-full">
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
                  <span className="text-red-500 capitalize">{errors.password}</span>
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
                  <span className="text-red-500 capitalize">{errors.password_confirmation}</span>
                ) : 'Ulangi password baru Anda.'}
              </FieldDescription>
            </Field>

            <Button type="submit" className="w-full" disabled={processing}>
              {processing ? 'Memproses...' : 'Reset Password'}
            </Button>
          </>
        )}
      </Form>
    </div>
  );
};

PasswordReset.layout = (page: ReactNode) => <AuthLayout>{page}</AuthLayout>;

export default PasswordReset;
