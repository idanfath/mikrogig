import { Head, usePage } from '@inertiajs/react';

import type { PropsWithChildren, ReactElement } from 'react';
import { Logo } from '@/components/brand/logo';

interface OnboardingLayoutProps extends PropsWithChildren {
    title?: string;
    description?: string;
}

export default function OnboardingLayout({
    children,
    title,
    description,
}: OnboardingLayoutProps) {
    return (
        <>
            <Head title={title ?? 'Onboarding'} />
            <main className="flex min-h-screen justify-center bg-background p-6 sm:items-center">
                <div className="flex w-full max-w-2xl flex-col gap-4">
                    <Logo />

                    {(title || description) && (
                        <header className="flex flex-col gap-2 select-none">
                            {title && (
                                <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                                    {title}
                                </h1>
                            )}
                            {description && (
                                <p className="text-sm text-muted-foreground">
                                    {description}
                                </p>
                            )}
                        </header>
                    )}

                    {children}
                </div>
            </main>
        </>
    );
}
