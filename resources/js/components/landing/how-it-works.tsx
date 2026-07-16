import { BadgeCheck, FileSignature, Mic2, WalletCards } from 'lucide-react';
import * as React from 'react';

import { Card } from './ui/card';
import { Section } from './ui/section';
import { SectionHeader } from './ui/section-header';
import { cn } from '@/lib/utils';

interface StepItem {
    number: string;
    title: React.ReactNode;
    description: React.ReactNode;
    icon?: React.ReactNode;
}

interface HowItWorksProps extends Omit<
    React.HTMLAttributes<HTMLElement>,
    'title'
> {
    badge?: React.ReactNode;
    title?: React.ReactNode;
    description?: React.ReactNode;
    steps?: StepItem[];
}

const defaultSteps: StepItem[] = [
    {
        number: '01',
        title: 'Ceritakan keahlianmu',
        description:
            'Isi profil dengan formulir sederhana atau bicara langsung. AI merapikan pengalaman menjadi profil yang mudah dipahami.',
        icon: <Mic2 />,
    },
    {
        number: '02',
        title: 'Pilih gig yang aman',
        description:
            'Bandingkan lokasi, verifikasi pemberi kerja, ruang lingkup, durasi, risiko, dan rentang upah sebelum menerima.',
        icon: <BadgeCheck />,
    },
    {
        number: '03',
        title: 'Setujui kontrak',
        description:
            'Kontrak otomatis merangkum tugas, upah, bukti kerja, pembatalan, dan dana escrow dalam bahasa sederhana.',
        icon: <FileSignature />,
    },
    {
        number: '04',
        title: 'Selesaikan & dibayar',
        description:
            'Unggah bukti selesai, pemberi kerja mengonfirmasi, lalu dana dilepas. Jika ada masalah, bukti masuk pusat sengketa.',
        icon: <WalletCards />,
    },
];

function HowItWorks({
    badge = 'Alur yang mudah diikuti',
    title = 'Dari keahlian sehari-hari menjadi penghasilan yang terlindungi.',
    description = 'Satu alur sederhana untuk pekerja yang baru mengenal platform digital—tanpa mengorbankan keamanan dan transparansi.',
    steps = defaultSteps,
    className,
    ...props
}: HowItWorksProps) {
    return (
        <Section id="how-it-works" className={cn(className)} {...props}>
            <SectionHeader
                badge={badge}
                heading={title}
                description={description}
            />

            <div className="relative grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div
                    className="absolute top-8 right-[12.5%] left-[12.5%] hidden border-t border-dashed border-primary/30 lg:block"
                    aria-hidden="true"
                />
                {steps.map((step, index) => (
                    <Card
                        key={step.number}
                        padding="lg"
                        className="relative z-10 h-full bg-background"
                    >
                        <div className="flex items-center justify-between gap-4">
                            <span className="grid size-13 place-items-center rounded-2xl border border-primary/20 bg-accent text-primary [&_svg]:size-5">
                                {step.icon}
                            </span>
                            <span className="text-xs font-extrabold tracking-[0.12em] text-muted-foreground">
                                {step.number}
                            </span>
                        </div>
                        <h3 className="mt-7 text-lg font-extrabold tracking-[-0.025em]">
                            {step.title}
                        </h3>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            {step.description}
                        </p>
                        {index < steps.length - 1 && (
                            <span
                                className="mt-6 block h-1 w-10 rounded-full bg-primary/25 lg:hidden"
                                aria-hidden="true"
                            />
                        )}
                    </Card>
                ))}
            </div>
        </Section>
    );
}

export { HowItWorks };
