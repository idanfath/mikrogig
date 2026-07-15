import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import AuthLayout from '@/layout/AuthLayout';
import { login } from '@/routes';
import password from '@/routes/password';

const ForgotPassword = () => {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const [lastSentTime, setLastSentTime] = useState<number | null>(() => {
        if (typeof window === 'undefined') {
            return null;
        }

        const storedTime = localStorage.getItem('lastPasswordResetRequest');

        return storedTime ? parseInt(storedTime) : null;
    });

    function handlePasswordResetRequest() {
        post(password.forgot.submit.url(), {
            onSuccess: () => {
                const currentTime = Date.now();
                setLastSentTime(currentTime);
                localStorage.setItem(
                    'lastPasswordResetRequest',
                    currentTime.toString(),
                );
            },
        });
    }

    return (
        <>
            {/*
      using useForm just for this one case because it's simpler than doing workarounds
      when using Form component (trying to trigger handlePasswordResetRequest on submit)
      */}
            <div className="w-full max-w-xl p-6">
                <Field className="mb-4" data-invalid={!!errors.email}>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="example@email.com"
                        required
                        value={data.email}
                        onChange={(e) =>
                            setData('email', e.currentTarget.value)
                        }
                    />
                    <FieldDescription>
                        {errors.email ? (
                            <span className="text-destructive capitalize">
                                {errors.email}
                            </span>
                        ) : (
                            'Masukkan email terdaftar Anda.'
                        )}
                    </FieldDescription>
                </Field>

                <Button
                    type="button"
                    onClick={handlePasswordResetRequest}
                    className="w-full"
                    disabled={
                        processing ||
                        (lastSentTime !== null &&
                            Date.now() - lastSentTime < 60000)
                    }
                >
                    {processing ? 'Memproses...' : 'Kirim Link Reset'}
                </Button>
            </div>
        </>
    );
};

ForgotPassword.layout = (page: ReactNode) => (
    <AuthLayout
        title="Lupa Password"
        heading="Reset Password"
        description="Masukkan email Anda dan kami akan mengirimkan link untuk mengatur ulang password Anda."
        footer={
            <p className="mt-4">
                <a
                    href={login.url()}
                    className="font-semibold text-primary hover:underline"
                >
                    Kembali ke Login
                </a>
            </p>
        }
    >
        {page}
    </AuthLayout>
);

export default ForgotPassword;
