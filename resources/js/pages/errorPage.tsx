import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import asset from '@/lib/assets';
import { home, logout } from '@/routes';

type ErrorStatus = 403 | 404 | 500 | 503;

type ErrorPageProps = {
  status: number;
};

const titleByStatus: Record<ErrorStatus, string> = {
  503: 'Service Tidak Tersedia',
  500: 'Kesalahan Server Internal',
  404: 'Halaman Tidak Ditemukan',
  403: 'Akses Terlarang',
};

const descriptionByStatus: Record<ErrorStatus, string> = {
  503: 'Maaf, kami sedang melakukan pemeliharaan. Silakan coba lagi nanti.',
  500: 'Ups, terjadi kesalahan pada server kami.',
  404: 'Maaf, halaman yang Anda cari tidak dapat ditemukan.',
  403: 'Maaf, Anda tidak memiliki izin untuk mengakses halaman ini.',
};

export default function ErrorPage({ status }: ErrorPageProps) {
  const safeStatus: ErrorStatus =
    status === 403 || status === 404 || status === 500 || status === 503
      ? status
      : 500;

  const title = titleByStatus[safeStatus];
  const description = descriptionByStatus[safeStatus];

  return (
    <div className="flex h-screen flex-col gap-4 items-center justify-center bg-background">
      <Head title={title} />
      <img
        src={asset('assets/illustrations/error_illustration.png')}
        alt="Error"
        className="max-w-md rounded-md object-cover"
      />
      <div className='text-center'>
        <p className="text-6xl font-bold">{status}</p>
        <p className="text-2xl font-semibold">{title}</p>
        <div className="text-center">{description}</div>
      </div>

      {status !== 403 ? (
        <Button
          variant={'default'}
          size={'lg'}
          onClick={() => window.history.back()}
        >
          Kembali
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button
            variant={'default'}
            size={'lg'}
            onClick={() => router.visit(home.url())}
          >
            Kembali ke Homepage
          </Button>
          <Button
            variant={'destructive'}
            size={'lg'}
            onClick={() => router.post(logout.url())}
          >
            Logout
          </Button>
        </div>
      )}
    </div>
  );
}
