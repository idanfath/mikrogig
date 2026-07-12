import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import AuthLayout from '@/layout/AuthLayout';
import { register } from '@/routes';
import login from '@/routes/login';
import password from '@/routes/password';
import { Form, Head } from '@inertiajs/react';
import { ReactElement, ReactNode } from 'react';

type InertiaPageWithLayout = (() => ReactElement) & {
  layout?: (page: ReactNode) => ReactNode;
};

const Login: InertiaPageWithLayout = () => {
  return (
    <div className="flex items-center justify-center h-screen flex-col ">
      <Head title="Login" />
      <p className="text-2xl font-bold mb-2">Masuk ke Akun Anda</p>
      <p className="text-muted-foreground text-center max-w-md px-6">
        Silakan masukkan email dan password Anda untuk masuk ke akun Anda.
      </p>

      <Form action={login.submit.url()} method="post" className="p-6 max-w-xl w-full">
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
                {errors.email ? (
                  <span className="text-red-500 capitalize">{errors.email}</span>
                ) : 'Masukkan email terdaftar Anda.'}
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
                {errors.password ? (
                  <span className="text-red-500 capitalize">{errors.password}</span>
                ) : 'Masukkan password Anda.'}
              </FieldDescription>
            </Field>

            <Button type="submit" disabled={processing}>
              {processing ? 'Memproses...' : 'Masuk'}
            </Button>
          </>
        )}
      </Form>

      <div className='flex flex-col items-center'>
        <p className="mt-4">Belum punya akun? <a href={register.url()} className="text-blue-500">Daftar</a></p>
        <p >Lupa password? <a href={password.forgot.url()} title="Lupa Password" className="text-blue-500">Reset Password</a></p>
      </div>
    </div>
  );
};

Login.layout = (page: ReactNode) => <AuthLayout>{page}</AuthLayout>;

export default Login;
