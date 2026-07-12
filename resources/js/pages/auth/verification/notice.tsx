import { Button } from '@/components/ui/button';
import PleaseVerifyImage from '@/assets/verification/notice/UmaruPlsVerify.webp';
import { Head, router, usePage } from '@inertiajs/react';
import { ReactElement, ReactNode, useState } from 'react';
import AuthLayout from '@/layout/AuthLayout';
import { home, logout } from '@/routes';
import verification from '@/routes/verification';

type InertiaPageWithLayout = (() => ReactElement) & {
  layout?: (page: ReactNode) => ReactNode;
};

const Notice: InertiaPageWithLayout = () => {
  const id = usePage().props.id as string;

  const [lastSentTime, setLastSentTime] = useState<number | null>(() => {
    const storedTime = localStorage.getItem('lastVerificationEmailSent');
    return storedTime ? parseInt(storedTime) : null;
  });

  function handleResendVerification() {
    router.post(verification.send.url(), {
      id,
    });
    const currentTime = Date.now();
    setLastSentTime(currentTime);
    localStorage.setItem('lastVerificationEmailSent', currentTime.toString());
  }

  return (
    <div className="flex items-center justify-center h-screen flex-col ">
      <Head title="Notice" />
      <img src={PleaseVerifyImage} alt="Please Verify!" className="rounded-md object-cover max-w-sm" />
      <h1 className="text-6xl font-bold">Uh-oh!</h1>
      <p className="text-2xl font-semibold">Mohon verifikasi email Anda.</p>
      <p className="text-center">Klik tombol di bawah untuk mengirim ulang email verifikasi.</p>
      <div className='flex gap-2 mt-2'>
        <Button className="mt-2" onClick={handleResendVerification} disabled={lastSentTime !== null && Date.now() - lastSentTime < 60000}>
          Kirim Ulang Email Verifikasi
        </Button>
        <Button className="mt-2" variant="outline" onClick={() => router.get(home.url())}>
          Beranda
        </Button>
      </div>
    </div >
  );
}

Notice.layout = (page: ReactNode) => <AuthLayout>{page}</AuthLayout>;

export default Notice;
