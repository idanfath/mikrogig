import {
    FileText,
    MessageSquare,
    Mic,
    ShieldCheck,
    Sparkles,
} from 'lucide-react';
import * as React from 'react';

import { FeatureCard } from '@/components/ui/feature-card';
import { Section } from '@/components/ui/section';
import { SectionHeader } from '@/components/ui/section-header';
import { cn } from '@/lib/utils';

interface AIFeature {
    title: React.ReactNode;
    description: React.ReactNode;
    icon: React.ReactNode;
    eyebrow?: React.ReactNode;
    tone?: 'default' | 'orange' | 'green' | 'dark';
    className?: string;
    visual?: React.ReactNode;
}

interface AIFeaturesProps extends Omit<
    React.HTMLAttributes<HTMLElement>,
    'title'
> {
    badge?: React.ReactNode;
    title?: React.ReactNode;
    description?: React.ReactNode;
    features?: AIFeature[];
}

const waveform = [12, 25, 16, 34, 22, 40, 18, 30, 14, 24, 11];

const defaultFeatures: AIFeature[] = [
    {
        title: 'Profil profesional cukup dengan berbicara',
        description:
            'AI Voice Onboarding mengubah cerita pengalaman menjadi bio, daftar keahlian, dan profil kerja tanpa formulir panjang.',
        icon: <Mic className="size-5" />,
        eyebrow: 'Akses utama',
        tone: 'orange',
        className: 'md:col-span-2',
        visual: (
            <div
                className="flex h-16 items-center gap-1 rounded-2xl border border-brand/15 bg-white/70 px-4"
                aria-hidden="true"
            >
                <span className="mr-2 grid size-8 place-items-center rounded-full bg-brand text-white">
                    <Mic className="size-3.5" />
                </span>
                {waveform.map((height, index) => (
                    <span
                        key={index}
                        className="w-1 rounded-full bg-brand/65"
                        style={{ height }}
                    />
                ))}
                <span className="ml-auto text-[10px] font-bold text-muted-foreground">
                    Mendengarkan…
                </span>
            </div>
        ),
    },
    {
        title: 'Kontrak dijelaskan dalam bahasa sederhana',
        description:
            'Poin penting, risiko, dan kewajiban diringkas serta dapat dibacakan sebelum pengguna menyetujui.',
        icon: <FileText className="size-5" />,
        eyebrow: 'Paham sebelum setuju',
        tone: 'dark',
        visual: (
            <div className="space-y-2" aria-hidden="true">
                <div className="h-2 w-full rounded-full bg-white/10" />
                <div className="h-2 w-4/5 rounded-full bg-white/10" />
                <div className="h-2 w-2/3 rounded-full bg-brand/70" />
            </div>
        ),
    },
    {
        title: 'Copilot untuk sengketa',
        description:
            'AI membantu mengurutkan chat, bukti foto, waktu check-in, dan kontrak agar admin dapat menilai secara konsisten.',
        icon: <MessageSquare className="size-5" />,
        eyebrow: 'Bukti lebih rapi',
        tone: 'default',
        visual: (
            <div className="rounded-xl bg-secondary p-3 text-xs leading-5 text-muted-foreground">
                3 bukti ditemukan · kronologi siap ditinjau
            </div>
        ),
    },
    {
        title: 'Peringatan pola berisiko',
        description:
            'Sistem menandai ajakan pembayaran di luar platform, perubahan kontrak mendadak, dan pola akun yang mencurigakan.',
        icon: <ShieldCheck className="size-5" />,
        eyebrow: 'Pencegahan fraud',
        tone: 'green',
        className: 'md:col-span-2',
        visual: (
            <div className="grid gap-2 sm:grid-cols-3" aria-hidden="true">
                {[
                    'Chat dipantau',
                    'Kontrak diperiksa',
                    'Risiko dijelaskan',
                ].map((item) => (
                    <span
                        key={item}
                        className="rounded-xl border border-success/12 bg-white/70 px-3 py-2 text-center text-[10px] font-extrabold text-success"
                    >
                        {item}
                    </span>
                ))}
            </div>
        ),
    },
];

function AIFeatures({
    badge = 'AI yang menurunkan hambatan akses',
    title = 'Teknologi bekerja di belakang. Pengguna tetap memegang keputusan.',
    description = 'AI MikroGig tidak menggantikan manusia. Ia membantu pekerja memahami, mengisi, dan membuktikan—terutama saat literasi digital atau kemampuan mengetik menjadi hambatan.',
    features = defaultFeatures,
    className,
    ...props
}: AIFeaturesProps) {
    return (
        <Section id="ai-features" className={cn(className)} {...props}>
            <SectionHeader
                badge={badge}
                heading={title}
                description={description}
                action={
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-extrabold text-muted-foreground">
                        <Sparkles
                            className="size-3.5 text-brand"
                            aria-hidden="true"
                        />{' '}
                        AI membantu, manusia memutuskan
                    </div>
                }
            />
            <div className="grid auto-rows-fr gap-4 md:grid-cols-2 lg:grid-cols-3">
                {features.map((feature, index) => (
                    <FeatureCard key={index} {...feature} />
                ))}
            </div>
        </Section>
    );
}

export { AIFeatures };
