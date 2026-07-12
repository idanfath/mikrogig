import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import AuthLayout from '@/layout/AuthLayout';
import { login } from '@/routes';
import password from '@/routes/password';
import { Head, useForm } from '@inertiajs/react';
import { ReactElement, ReactNode, useState } from 'react';

type InertiaPageWithLayout = (() => ReactElement) & {
  layout?: (page: ReactNode) => ReactNode;
};

const ForgotPassword: InertiaPageWithLayout = () => {

  const { data, setData, post, processing, errors } = useForm({
    email: '',
  });

  const [lastSentTime, setLastSentTime] = useState<number | null>(() => {
    const storedTime = localStorage.getItem('lastPasswordResetRequest');
    return storedTime ? parseInt(storedTime) : null;
  });

  function handlePasswordResetRequest() {
    post(password.forgot.submit.url(), {
      onSuccess: () => {
        const currentTime = Date.now();
        setLastSentTime(currentTime);
        localStorage.setItem('lastPasswordResetRequest', currentTime.toString());
      },
    });
  }

  return (
    <div className="flex items-center justify-center h-screen flex-col ">
      <Head title="Lupa Password" />
      <p className="text-2xl font-bold mb-4">Reset Password</p>
      <p className="text-muted-foreground text-center max-w-md px-6">
        Masukkan email Anda dan kami akan mengirimkan link untuk mengatur ulang password Anda.
      </p>

      {/*
      using useForm just for this one case because it's simpler than doing workarounds
      when using Form component (trying to trigger handlePasswordResetRequest on submit)
      */}
      <div className="p-6 max-w-xl w-full">
        <Field className="mb-4" data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder='example@email.com'
            required
            value={data.email}
            onChange={(e) => setData('email', e.currentTarget.value)}
          />
          <FieldDescription>
            {errors.email ? (
              <span className="text-red-500 capitalize">{errors.email}</span>
            ) : 'Masukkan email terdaftar Anda.'}
          </FieldDescription>
        </Field>

        <Button type="button" onClick={handlePasswordResetRequest}
          className="w-full" disabled={processing || (lastSentTime !== null && Date.now() - lastSentTime < 60000)}>
          {processing ? 'Memproses...' : 'Kirim Link Reset'}
        </Button>
      </div>

      <div className='flex flex-col items-center'>
        <p className="mt-4"><a href={login.url()} className="text-blue-500">Kembali ke Login</a></p>
      </div>
    </div>
  );
};

ForgotPassword.layout = (page: ReactNode) => <AuthLayout>{page}</AuthLayout>;

export default ForgotPassword;
