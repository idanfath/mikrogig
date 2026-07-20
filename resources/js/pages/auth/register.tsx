import { Form, router } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import AuthLayout from '@/layout/AuthLayout';
import { login } from '@/routes';
import register from '@/routes/register';
import { sentenceCase } from '@/lib/utils';

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
              aria-invalid={!!errors.name}
              mobileLarge
            />
            <FieldError>{sentenceCase(errors.name)}</FieldError>
          </Field>

          <Field className="mb-4" data-invalid={!!errors.email}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="example@email.com"
              aria-invalid={!!errors.email}
              mobileLarge
            />
            <FieldError>{sentenceCase(errors.email)}</FieldError>
          </Field>

          <Field className="mb-4" data-invalid={!!errors.password}>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              mobileLarge
            />
            <FieldError>{sentenceCase(errors.password)}</FieldError>
          </Field>

          <Field className="mb-4" data-invalid={!!errors.password_confirmation}>
            <FieldLabel htmlFor="password_confirmation">
              Konfirmasi Password
            </FieldLabel>
            <Input
              id="password_confirmation"
              name="password_confirmation"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              aria-invalid={!!errors.password_confirmation}
              mobileLarge
            />
            <FieldError>
              {sentenceCase(errors.password_confirmation)}
            </FieldError>
          </Field>

          <Button
            type="submit"
            className="w-full"
            disabled={processing}
            mobileLarge
          >
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
