import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import AuthLayout from '@/layout/AuthLayout';
import { login } from '@/routes';
import register from '@/routes/register';
import { Form, Head } from '@inertiajs/react';
import { ReactElement, ReactNode } from 'react';

type InertiaPageWithLayout = (() => ReactElement) & {
  layout?: (page: ReactNode) => ReactNode;
};

const Register: InertiaPageWithLayout = () => {
  return (
    <div className="flex items-center justify-center h-screen flex-col ">
      <Head title="Register" />
      <p className="text-2xl font-bold mb-2">Buat Akun Baru</p>
      <p className="text-muted-foreground text-center max-w-md px-6">
        Silahkan isi formulir di bawah ini untuk membuat akun baru Anda.
      </p>

      <Form action={register.submit.url()} method="post" className="p-6 max-w-xl w-full">
        {({ errors, processing }) => (
          <>
            <Field className="mb-4" data-invalid={!!errors.name}>
              <FieldLabel htmlFor="name">Nama</FieldLabel>
              <Input id="name" name="name" autoComplete="name" placeholder="John Doe" />
              <FieldDescription>
                {errors.name ? (
                  <span className="text-red-500 capitalize">{errors.name}</span>
                ) : 'Masukkan nama lengkap Anda.'}
              </FieldDescription>
            </Field>

            <Field className="mb-4" data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" name="email" type="email" autoComplete="email" placeholder="example@email.com" />
              <FieldDescription>
                {errors.email ? (
                  <span className="text-red-500 capitalize">{errors.email}</span>
                ) : 'Masukkan email terdaftar Anda.'}
              </FieldDescription>
            </Field>

            <Field className="mb-4" data-invalid={!!errors.password}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input id="password" name="password" type="password" autoComplete="new-password" placeholder="••••••••" />
              <FieldDescription>
                {errors.password ? (
                  <span className="text-red-500 capitalize">{errors.password}</span>
                ) : 'Buat password untuk akun Anda.'}
              </FieldDescription>
            </Field>

            <Field className="mb-4" data-invalid={!!errors.password_confirmation}>
              <FieldLabel htmlFor="password_confirmation">Konfirmasi Password</FieldLabel>
              <Input id="password_confirmation" name="password_confirmation" type="password" autoComplete="new-password" placeholder="••••••••" />
              <FieldDescription>
                {errors.password_confirmation ? (
                  <span className="text-red-500 capitalize">{errors.password_confirmation}</span>
                ) : 'Konfirmasi password yang Anda buat.'}
              </FieldDescription>
            </Field>

            <Button type="submit" disabled={processing}>
              {processing ? 'Memproses...' : 'Daftar'}
            </Button>
          </>
        )}
      </Form>

      <p className="mt-4">Sudah punya akun? <a href={login.url()} className="text-blue-500">Masuk</a></p>
    </div>
  );
};

Register.layout = (page: ReactNode) => <AuthLayout>{page}</AuthLayout>;

export default Register;
