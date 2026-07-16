import { Head, router } from '@inertiajs/react';
import type { ReactElement, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import StatusLayout from '@/layout/StatusLayout';
import asset from '@/lib/assets';
import { home, logout } from '@/routes';

type ErrorStatus = 403 | 404 | 500 | 503;

type ErrorPageProps = {
  status: number;
};

type InertiaPageWithLayout = ((props: ErrorPageProps) => ReactElement) & {
  layout?: (page: ReactNode) => ReactNode;
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

const ErrorPage: InertiaPageWithLayout = ({ status }) => {
  const safeStatus: ErrorStatus =
    status === 403 || status === 404 || status === 500 || status === 503
      ? status
      : 500;

  const title = titleByStatus[safeStatus];
  const description = descriptionByStatus[safeStatus];

  return (
    <>
      <Head title={title} />
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-1 flex-col items-center justify-center text-center sm:flex-none">
          <div className="flex flex-col items-center gap-4">
            <img
              src={asset(
                'assets/illustrations/error_illustration.png',
              )}
              alt="Error"
              className="w-full max-w-md rounded-md object-cover px-8"
            />
            <div>
              <p className="text-6xl font-bold">{status}</p>
              <p className="text-2xl font-semibold">{title}</p>
              <div>{description}</div>
            </div>
          </div>
        </div>
        <div className="mt-auto w-full shrink-0 sm:w-fit sm:self-center">
          {status !== 403 ? (
            <Button
              variant="default"
              size="lg"
              mobileLarge
              className="w-full sm:w-auto"
              onClick={() => window.history.back()}
            >
              Kembali
            </Button>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="default"
                size="lg"
                mobileLarge
                className="w-full sm:w-auto"
                onClick={() => router.visit(home.url())}
              >
                Kembali ke Homepage
              </Button>
              <Button
                variant="destructive"
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => router.post(logout.url())}
              >
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

ErrorPage.layout = (page: ReactNode) => <StatusLayout>{page}</StatusLayout>;

export default ErrorPage;
