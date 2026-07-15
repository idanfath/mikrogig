import { Head, router, usePage } from '@inertiajs/react';
import type { ReactElement, ReactNode } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/layout/AuthLayout';
import asset from '@/lib/assets';
import { home, logout } from '@/routes';
import verification from '@/routes/verification';
import PleaseVerifyImage from '@/assets/verification/notice/UmaruPlsVerify.webp';


const Notice = () => {
  const id = usePage().props.id as string;

  const [lastSentTime, setLastSentTime] = useState<number | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    const storedTime = localStorage.getItem('lastVerificationEmailSent');

    return storedTime ? parseInt(storedTime) : null;
  });

  function handleResendVerification() {
    router.post(verification.send.url(), {
      id,
    });
    const currentTime = Date.now();
    setLastSentTime(currentTime);
    localStorage.setItem(
      'lastVerificationEmailSent',
      currentTime.toString(),
    );
  }

  return (
    <div className="flex h-screen flex-col gap-4 items-center justify-center bg-background">
      <Head title="Notice" />
      <img
        src={asset('assets/illustrations/error_illustration.png')}
        alt="Error"
        className="max-w-md rounded-md object-cover"
      />
      <div className='text-center'>
        <h1 className="text-6xl font-bold">Email belum diverifikasi</h1>
        <p className="text-2xl font-semibold">
          Mohon verifikasi email Anda.
        </p>
        <p className="text-center">
          Klik tombol di bawah untuk mengirim ulang email verifikasi.
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={handleResendVerification}
          disabled={
            lastSentTime !== null &&
            Date.now() - lastSentTime < 60000
          }
        >
          Kirim Ulang Email Verifikasi
        </Button>
        <Button
          variant="outline"
          onClick={() => router.get(home.url())}
        >
          Kembali
        </Button>
        <Button
          variant="destructive"
          onClick={() => router.post(logout.url())}
        >
          Logout
        </Button>
      </div>
    </div >
  );
};

export default Notice;
