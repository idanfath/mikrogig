import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { Logo } from '@/components/brand/logo';
import Layout from './Layout';

type AuthLayoutProps = {
    title?: string;
    heading?: string;
    description?: string;
    children: ReactNode;
    footer?: ReactNode;
};

export default function AuthLayout({
    title,
    heading,
    description,
    children,
    footer,
}: AuthLayoutProps) {
    return (
        <Layout>
            {title && <Head title={title} />}
            <main className="flex min-h-screen flex-col items-center justify-center py-10">
                {heading && description && (
                    <header className="flex flex-col items-center gap-6 px-6">
                        <Logo size="large" />
                        <div className="text-center">
                            <h1 className="text-2xl font-bold">{heading}</h1>
                            <p className="max-w-md text-muted-foreground">
                                {description}
                            </p>
                        </div>
                    </header>
                )}
                {children}
                {footer}
            </main>
        </Layout>
    );
}
