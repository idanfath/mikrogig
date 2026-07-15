import { Form, router } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import AuthLayout from '@/layout/AuthLayout';
import { login } from '@/routes';
import register from '@/routes/register';

const Register = () => {
  return (
    <Form
      action={register.submit.url()}
      method="post"
      className="w-full max-w-xl p-6"
    >
      {({ errors, processing }) => (
        <>
          <Field className="mb-4" data-invalid={!!errors.name}>
            <FieldLabel htmlFor="name">Nama</FieldLabel>
            <Input
              id="name"
              name="name"
              autoComplete="name"
              placeholder="John Doe"
            />
            <FieldDescription>
              {errors.name && (
                <span className="text-destructive capitalize">
                  {errors.name}
                </span>
              )}
            </FieldDescription>
          </Field>

          <Field className="mb-4" data-invalid={!!errors.email}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="example@email.com"
            />
            <FieldDescription>
              {errors.email && (
                <span className="text-destructive capitalize">
                  {errors.email}
                </span>
              )}
            </FieldDescription>
          </Field>

          <Field className="mb-4" data-invalid={!!errors.password}>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
            />
            <FieldDescription>
              {errors.password && (
                <span className="text-destructive capitalize">
                  {errors.password}
                </span>
              )}
            </FieldDescription>
          </Field>

          <Field
            className="mb-4"
            data-invalid={!!errors.password_confirmation}
          >
            <FieldLabel htmlFor="password_confirmation">
              Konfirmasi Password
            </FieldLabel>
            <Input
              id="password_confirmation"
              name="password_confirmation"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
            />
            <FieldDescription>
              {errors.password_confirmation && (
                <span className="text-destructive capitalize">
                  {errors.password_confirmation}
                </span>
              )}
            </FieldDescription>
          </Field>

          <Button type="submit" className='w-full' disabled={processing}>
            {processing ? 'Memproses...' : 'Daftar'}
          </Button>
        </>
      )}
    </Form>
  );
};

Register.layout = (page: ReactNode) => (
  <AuthLayout
    title="Register"
    heading="Buat Akun Baru"
    description="Silahkan isi formulir di bawah ini untuk membuat akun baru Anda."
    footer={
      <p>
        Sudah punya akun?{' '}
        <a
          href={login.url()}
          className="font-semibold text-primary hover:underline"
        >
          Masuk
        </a>
      </p>
    }
  >
    {page}
  </AuthLayout>
);

export default Register;
