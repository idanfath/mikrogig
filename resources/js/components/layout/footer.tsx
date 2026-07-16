import { Link } from '@inertiajs/react';
import { ArrowUpRight, Mail } from 'lucide-react';
import * as React from 'react';

import { Container } from '@/components/layout/container';
import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';
import { login, register } from '@/routes';

interface FooterLink {
    label: string;
    href: string;
}

interface FooterColumn {
    title: string;
    links: FooterLink[];
}

interface FooterProps {
    description?: React.ReactNode;
    columns?: FooterColumn[];
    className?: string;
}

const defaultColumns: FooterColumn[] = [
    {
        title: 'Jelajahi',
        links: [
            { label: 'Cara kerja', href: '#how-it-works' },
            { label: 'Kategori pekerjaan', href: '#categories' },
            { label: 'Simulasi upah', href: '#fair-wage' },
        ],
    },
    {
        title: 'Perlindungan',
        links: [
            { label: 'Kontrak digital', href: '#fair-wage' },
            { label: 'Escrow pembayaran', href: '#trust-system' },
            { label: 'Pusat sengketa', href: '#user-scenarios' },
        ],
    },
    {
        title: 'Bantuan',
        links: [
            { label: 'Pertanyaan umum', href: '#faq' },
            { label: 'Aksesibilitas AI', href: '#ai-features' },
            { label: 'Mulai menggunakan', href: '#mulai' },
        ],
    },
];

function Footer({
    description = 'Platform kerja lokal yang dirancang untuk memberi pekerja informal akses yang lebih aman, mudah, dan setara ke ekonomi digital.',
    columns = defaultColumns,
    className,
}: FooterProps) {
    return (
        <footer className={cn('bg-foreground text-background', className)}>
            <Container className="py-14 sm:py-18">
                <div className="grid gap-12 lg:grid-cols-[1.35fr_2fr] lg:gap-16">
                    <div>
                        <Logo tone="inverse" size="lg" />
                        <p className="mt-5 max-w-sm text-sm leading-7 text-white/60">
                            {description}
                        </p>
                        <a
                            href="mailto:halo@mikrogig.com"
                            className="mt-6 inline-flex items-center gap-2 rounded-lg text-sm font-bold text-white outline-none hover:text-brand focus-visible:ring-3 focus-visible:ring-brand/30"
                        >
                            <Mail className="size-4" aria-hidden="true" />
                            halo@mikrogig.com
                        </a>
                    </div>

                    <nav
                        aria-label="Navigasi footer"
                        className="grid grid-cols-2 gap-8 sm:grid-cols-3"
                    >
                        {columns.map((column) => (
                            <div key={column.title}>
                                <h2 className="text-xs font-extrabold tracking-[0.12em] text-white/45 uppercase">
                                    {column.title}
                                </h2>
                                <ul className="mt-5 space-y-3">
                                    {column.links.map((item) => (
                                        <li key={item.href + item.label}>
                                            <a
                                                className="text-sm font-semibold text-white/72 transition-colors hover:text-white"
                                                href={item.href}
                                            >
                                                {item.label}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </nav>
                </div>

                <div className="mt-12 flex flex-col gap-6 border-t border-white/10 pt-7 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-bold text-white/70">
                            Prototipe kompetisi Veternity Beraksi 2026
                        </p>
                        <p className="mt-1 text-xs text-white/38">
                            © {new Date().getFullYear()} MikroGig. Dirancang
                            untuk akses ekonomi yang lebih setara.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <Link
                            href={login.url()}
                            className="text-xs font-bold text-white/60 hover:text-white"
                        >
                            Masuk
                        </Link>
                        <Link
                            href={register.url()}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:text-white"
                        >
                            Buat akun{' '}
                            <ArrowUpRight
                                className="size-3.5"
                                aria-hidden="true"
                            />
                        </Link>
                    </div>
                </div>
            </Container>
        </footer>
    );
}

export { Footer };
