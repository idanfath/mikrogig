import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import AuthLayout from '@/layout/AuthLayout';
import { register } from '@/routes';
import login from '@/routes/login';
import password from '@/routes/password';
import { Form } from '@inertiajs/react';
import type { ReactNode } from 'react';

const Login = () => {
  return (
    <Form action={login.submit.url()} method="post" className="w-full max-w-xl p-6">
      {({ errors, processing }) => (
        <>
          <Field className="mb-4" data-invalid={!!errors.email}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder='example@email.com'
            />
            <FieldDescription>
              {errors.email && (
                <span className="text-destructive capitalize">{errors.email}</span>
              )}
            </FieldDescription>
          </Field>

          <Field className="mb-4" data-invalid={!!errors.password}>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder='••••••••'
            />
            <FieldDescription>
              {errors.password && (
                <span className="text-destructive capitalize">{errors.password}</span>
              )}
            </FieldDescription>
          </Field>

          <Button type="submit" disabled={processing}>
            {processing ? 'Memproses...' : 'Masuk'}
          </Button>
        </>
      )}
    </Form>
  );
};

Login.layout = (page: ReactNode) => (
  <AuthLayout
    title="Login"
    heading="Masuk ke Akun Anda"
    description="Silakan masukkan email dan password Anda untuk masuk ke akun Anda."
    footer={
      <div className="flex flex-col items-center">
        <p className="mt-4">Belum punya akun? <a href={register.url()} className="font-semibold text-primary hover:underline">Daftar</a></p>
        <p>Lupa password? <a href={password.forgot.url()} title="Lupa Password" className="font-semibold text-primary hover:underline">Reset Password</a></p>
      </div>
    }
  >
    {page}
  </AuthLayout>
);

export default Login;
