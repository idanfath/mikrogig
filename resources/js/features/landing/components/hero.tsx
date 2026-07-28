import { Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Check,
    CircleDollarSign,
    FileCheck2,
    MapPin,
    MessageCircleMore,
    ShieldCheck,
    Users,
} from 'lucide-react';
import * as React from 'react';

import { Container } from '@/components/layout/container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { register } from '@/routes';
import app from '@/routes/app';
import { Card } from './ui/card';
import { FloatingCard } from './ui/floating-card';

interface HeroProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
    badge?: React.ReactNode;
    title?: React.ReactNode;
    description?: React.ReactNode;
}

function Hero({
    badge = 'Kerja lokal dengan kesepakatan jelas',
    title = (
        <>
            Temukan kerja lokal.{' '}
            <span className="text-primary">Sepakati bayaran.</span> Jalani
            dengan bukti.
        </>
    ),
    description = 'MikroGig mempertemukan orang yang mencari kerja dengan orang yang membutuhkan bantuan. Sepakati pekerjaan, bicara langsung, selesaikan pekerjaan, dan simpan bukti bila ada masalah.',
    className,
    ...props
}: HeroProps) {
    const { auth } = usePage<{ auth?: { user?: any } }>().props;
    const isLoggedIn = Boolean(auth?.user);
    return (
        <section
            id="beranda"
            className={cn(
                'relative isolate overflow-hidden pt-14 pb-18 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-28',
                className,
            )}
            {...props}
        >
            <div className="landing-grid pointer-events-none absolute inset-x-0 top-0 -z-20 h-176 opacity-70" />
            <div className="pointer-events-none absolute top-8 left-[62%] -z-10 size-112 rounded-full bg-primary/12 blur-3xl" />

            <Container>
                <div className="grid items-center gap-14 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
                    <div className="max-w-2xl">
                        <Badge variant="accent" size="xl">
                            <span
                                className="mr-1 size-1.5 rounded-full bg-primary"
                                aria-hidden="true"
                            />
                            {badge}
                        </Badge>

                        <h1 className="mt-6 text-[2.7rem] leading-[0.99] font-extrabold tracking-[-0.06em] text-balance sm:text-6xl lg:text-[4.5rem]">
                            {title}
                        </h1>
                        <p className="mt-6 max-w-xl text-base leading-7 text-pretty text-muted-foreground sm:text-lg sm:leading-8">
                            {description}
                        </p>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Button
                                asChild
                                size="lg"
                                className="h-14 rounded-2xl px-7 text-base"
                            >
                                <Link
                                    href={
                                        isLoggedIn ? app.home() : register.url()
                                    }
                                >
                                    {isLoggedIn ? 'Masuk ke Aplikasi' : 'Buat akun untuk mulai'}
                                    <ArrowRight
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                </Link>
                            </Button>
                            <Button
                                asChild
                                size="lg"
                                variant="outline"
                                className="h-14 rounded-2xl px-7 text-base"
                            >
                                <a href="#how-it-works">Lihat cara kerjanya</a>
                            </Button>
                        </div>
                    </div>

                    <ProductPreview />
                </div>
            </Container>
        </section>
    );
}

function ProductPreview() {
    return (
        <div className="relative mx-auto w-full max-w-140 lg:ml-auto">
            <div className="absolute -inset-5 -z-10 rounded-[2.4rem] bg-accent/75 blur-2xl" />
            <div className="rounded-[2rem] border border-white/70 bg-white/55 p-2.5 shadow-lg backdrop-blur-sm sm:p-3">
                <Card
                    variant="elevated"
                    padding="none"
                    className="overflow-hidden rounded-[1.65rem]"
                >
                    <div className="flex items-center justify-between border-b border-border bg-secondary/55 px-5 py-4">
                        <div className="flex items-center gap-2">
                            <span className="size-2.5 rounded-full bg-primary" />
                            <span className="size-2.5 rounded-full bg-border" />
                            <span className="size-2.5 rounded-full bg-border" />
                        </div>
                        <span className="text-[10px] font-extrabold tracking-widest text-muted-foreground uppercase">
                            Contoh kesepakatan kerja
                        </span>
                    </div>

                    <div className="p-5 sm:p-7">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <Badge variant="success">
                                    <CircleDollarSign
                                        className="size-3.5"
                                        aria-hidden="true"
                                    />
                                    Bayaran jelas
                                </Badge>
                                <h2 className="mt-4 text-xl font-extrabold tracking-[-0.035em] sm:text-2xl">
                                    Bantu pindahan kios
                                </h2>
                            </div>
                            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent text-primary">
                                <ShieldCheck
                                    className="size-5"
                                    aria-hidden="true"
                                />
                            </span>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
                            <PreviewMeta
                                icon={<MapPin />}
                                label="Lokasi"
                                value="Denpasar"
                            />
                            <PreviewMeta
                                icon={<Users />}
                                label="Pelamar"
                                value="3 penawaran"
                            />
                            <PreviewMeta
                                icon={<CircleDollarSign />}
                                label="Biaya awal"
                                value="Rp350.000"
                                className="col-span-2 sm:col-span-1"
                            />
                        </div>

                        <div className="mt-5 rounded-2xl border border-primary/15 bg-accent/40 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-sm font-extrabold">
                                    <FileCheck2
                                        className="size-4 text-primary"
                                        aria-hidden="true"
                                    />
                                    Kesepakatan kerja
                                </div>
                                <span className="text-xs font-bold text-success">
                                    Disetujui
                                </span>
                            </div>
                            <div className="mt-3 grid gap-2 text-xs leading-5 text-muted-foreground sm:grid-cols-2">
                                <p>Total akhir Rp375.000</p>
                                <p>Ruang lingkup kerja tercatat</p>
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="relative -mt-2 grid gap-2 px-3 pb-3 sm:grid-cols-2 sm:px-5">
                    <FloatingCard
                        variant="success"
                        size="sm"
                        icon={<MessageCircleMore className="size-4" />}
                        heading="Pesan langsung"
                        subtitle="Pesan dan status langsung tersinkron"
                    />
                    <FloatingCard
                        variant="dark"
                        size="sm"
                        icon={<ShieldCheck className="size-4" />}
                        heading="Pekerjaan terlindungi"
                        subtitle="Bukti tersimpan jika terjadi sengketa"
                    />
                </div>
            </div>
        </div>
    );
}

function PreviewMeta({
    icon,
    label,
    value,
    className,
}: {
    icon: React.ReactElement;
    label: string;
    value: string;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'rounded-xl border border-border bg-secondary/35 p-3',
                className,
            )}
        >
            <div className="flex items-center gap-1.5 text-muted-foreground [&_svg]:size-3.5">
                {icon}
                {label}
            </div>
            <p className="mt-1.5 font-extrabold text-foreground">{value}</p>
        </div>
    );
}

export { Hero };
