import {
    BriefcaseBusiness,
    FileSignature,
    HandCoins,
    ShieldCheck,
} from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';
import { Card } from './ui/card';
import { Section } from './ui/section';
import { SectionHeader } from './ui/section-header';

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
        title: 'Pasang pekerjaan',
        description:
            'Orang yang membutuhkan bantuan mencatat kebutuhan, lokasi, jadwal, bayaran awal, dan foto pekerjaan.',
        icon: <BriefcaseBusiness />,
    },
    {
        number: '02',
        title: 'Ajukan bayaran',
        description:
            'Orang yang mencari kerja menemukan pekerjaan berdasarkan lokasi dan jenisnya, lalu mengajukan bayaran.',
        icon: <HandCoins />,
    },
    {
        number: '03',
        title: 'Sepakati pekerjaan',
        description:
            'Kedua pihak menyepakati ruang lingkup dan total akhir sebelum pembayaran demo dikonfirmasi.',
        icon: <FileSignature />,
    },
    {
        number: '04',
        title: 'Kerjakan dengan perlindungan',
        description:
            'Pesan, bukti kerja, penyelesaian, rating, dan masalah berada dalam satu riwayat pekerjaan.',
        icon: <ShieldCheck />,
    },
];

function HowItWorks({
    badge = 'Satu alur untuk dua peran',
    title = 'Dari kebutuhan lokal menjadi kerja yang disepakati bersama.',
    description = 'Kedua pihak melihat tahap yang sama, menerima tindakan sesuai kebutuhannya, dan menyimpan riwayat dari awal sampai selesai.',
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
