import { Head, router, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/hooks/use-confirm';
import StatusLayout from '@/layout/StatusLayout';
import asset from '@/lib/assets';
import { home, logout } from '@/routes';
import verification from '@/routes/verification';

const Notice: InertiaPageWithLayout = () => {
  const [confirm, confirmDialog] = useConfirm();
  const id = usePage().props.id as string;

  const [lastSentTime, setLastSentTime] = useState<number | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    const storedTime = localStorage.getItem('lastVerificationEmailSent');

    return storedTime ? parseInt(storedTime) : null;
  });

  useEffect(() => {
    if (lastSentTime === null) {
      return;
    }

    const timer = window.setTimeout(
      () => setLastSentTime(null),
      Math.max(0, 60000 - (Date.now() - lastSentTime)),
    );

    return () => window.clearTimeout(timer);
  }, [lastSentTime]);

  const isCooldownActive = lastSentTime !== null;

  function handleResendVerification() {
    router.post(verification.send.url(), {
      id,
    });
    const currentTime = Date.now();
    setLastSentTime(currentTime);
    localStorage.setItem('lastVerificationEmailSent', currentTime.toString());
  }

  return (
    <>
      <Head title="Notice" />
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-1 flex-col items-center justify-center text-center sm:flex-none">
          <div className="flex flex-col items-center gap-4">
            <img
              src={asset('assets/illustrations/error_illustration.png')}
              alt="Error"
              className="w-full max-w-md rounded-md object-cover"
            />
            <div>
              <p className="text-2xl font-semibold">
                Mohon verifikasi email Anda.
              </p>
              <p>Klik tombol di bawah untuk mengirim ulang email verifikasi.</p>
            </div>
          </div>
        </div>
        <div className="mt-auto w-full shrink-0 sm:w-fit sm:self-center">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-center">
            <Button
              mobileLarge
              className="col-span-2 w-full sm:w-auto"
              onClick={handleResendVerification}
              disabled={isCooldownActive}
            >
              Kirim Ulang Email Verifikasi
            </Button>
            <Button
              mobileLarge
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => router.get(home.url())}
            >
              Kembali
            </Button>
            <Button
              mobileLarge
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={() => {
                confirm({
                  title: 'Konfirmasi Keluar',
                  description: 'Apakah Anda yakin ingin keluar dari akun Anda?',
                  confirmLabel: 'Keluar',
                  cancelLabel: 'Batal',
                  destructive: true,
                  onConfirm: () => router.post(logout.url()),
                });
              }}
            >
              Logout
            </Button>
          </div>
        </div>
        {confirmDialog}
      </div>
    </>
  );
};

Notice.layout = (page: ReactNode) => <StatusLayout>{page}</StatusLayout>;

export default Notice;
