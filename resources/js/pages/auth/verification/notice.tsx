import { Head, router, usePage } from '@inertiajs/react';
import type { ReactElement, ReactNode} from 'react';
import { useState } from 'react';
import PleaseVerifyImage from '@/assets/verification/notice/UmaruPlsVerify.webp';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/layout/AuthLayout';
import { home, logout } from '@/routes';
import verification from '@/routes/verification';

type InertiaPageWithLayout = (() => ReactElement) & {
    layout?: (page: ReactNode) => ReactNode;
};

const Notice: InertiaPageWithLayout = () => {
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
        <div className="flex h-screen flex-col items-center justify-center">
            <Head title="Notice" />
            <img
                src={PleaseVerifyImage}
                alt="Please Verify!"
                className="max-w-sm rounded-md object-cover"
            />
            <h1 className="text-6xl font-bold">Uh-oh!</h1>
            <p className="text-2xl font-semibold">
                Mohon verifikasi email Anda.
            </p>
            <p className="text-center">
                Klik tombol di bawah untuk mengirim ulang email verifikasi.
            </p>
            <div className="mt-2 flex gap-2">
                <Button
                    className="mt-2"
                    onClick={handleResendVerification}
                    disabled={
                        lastSentTime !== null &&
                        Date.now() - lastSentTime < 60000
                    }
                >
                    Kirim Ulang Email Verifikasi
                </Button>
                <Button
                    className="mt-2"
                    variant="outline"
                    onClick={() => router.get(home.url())}
                >
                    Beranda
                </Button>
            </div>
        </div>
    );
};

Notice.layout = (page: ReactNode) => <AuthLayout>{page}</AuthLayout>;

export default Notice;
