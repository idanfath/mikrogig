import { Head, router } from '@inertiajs/react';
import ErrorImage from '@/assets/ErrorPage/UmaruError.webp';
import { Button } from '@/components/ui/button';
import { home } from '@/routes';

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
    <div className='flex items-center justify-center h-screen flex-col '>
      <Head title={title} />
      <img src={ErrorImage} alt="Error" className="rounded-md object-cover max-w-xl" />
      <p className="text-6xl font-bold">{status}</p>
      <p className="text-2xl font-semibold">{title}</p>
      <div className="text-center">{description}</div>

      {status !== 403 ? (
        <Button variant={'outline'} size={'lg'} className="mt-4" onClick={() => window.history.back()}>
          Kembali
        </Button>
      ) : (
        <Button variant={'outline'} size={'lg'} className="mt-4" onClick={() => router.visit(home.url())}>
          Kembali ke Beranda
        </Button>
      )}
    </div>
  );
}
