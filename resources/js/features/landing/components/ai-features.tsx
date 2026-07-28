import {
    BriefcaseBusiness,
    FilePenLine,
    Scale,
    Sparkles,
    UserRoundPen,
} from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FeatureCard } from './ui/feature-card';
import { Section } from './ui/section';
import { SectionHeader } from './ui/section-header';

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

const defaultFeatures: AIFeature[] = [
    {
        title: 'Profil pencari kerja lebih mudah dirapikan',
        description:
            'AI membantu memperbaiki judul dan profil yang sudah ditulis, lalu menyarankan keahlian berdasarkan pengalaman pengguna.',
        icon: <UserRoundPen className="size-5" />,
        eyebrow: 'Profil pencari kerja',
        tone: 'orange',
        visual: (
            <div className="flex flex-wrap gap-2" aria-hidden="true">
                {['tenaga bongkar', 'penataan barang', 'kerja tim'].map(
                    (skill) => (
                        <Badge
                            key={skill}
                            variant="outline"
                            className="bg-white/70"
                        >
                            {skill}
                        </Badge>
                    ),
                )}
            </div>
        ),
    },
    {
        title: 'Pekerjaan lebih jelas sebelum dipasang',
        description:
            'Orang yang membutuhkan bantuan dapat memperbaiki judul dan deskripsi agar pekerjaan lebih mudah dipahami.',
        icon: <FilePenLine className="size-5" />,
        eyebrow: 'Menulis pekerjaan',
        tone: 'dark',
        visual: (
            <div
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/6 p-3 text-xs text-white/65"
                aria-hidden="true"
            >
                <BriefcaseBusiness className="size-4 text-primary" />
                Judul dan deskripsi siap ditinjau
            </div>
        ),
    },
    {
        title: 'Ringkasan bukti untuk admin',
        description:
            'AI menyusun ringkasan netral, kronologi, fakta konsisten, kontradiksi, dan referensi bukti tanpa menentukan pihak yang bersalah.',
        icon: <Scale className="size-5" />,
        eyebrow: 'Sengketa berbasis bukti',
        tone: 'green',
        className: 'md:col-span-2',
        visual: (
            <div className="grid gap-2 sm:grid-cols-3" aria-hidden="true">
                {['Kronologi', 'Kontradiksi', 'Referensi bukti'].map((item) => (
                    <Badge
                        key={item}
                        variant="success"
                        className="rounded-xl border border-success/12 bg-white/70 px-3 py-2 text-center text-[10px] font-extrabold text-success"
                    >
                        {item}
                    </Badge>
                ))}
            </div>
        ),
    },
];

function AIFeatures({
    badge = 'AI sesuai kebutuhan nyata',
    title = 'AI membantu menulis dan merangkum. Manusia tetap memutuskan.',
    description = 'Fitur AI MikroGig membantu mengolah teks yang diberikan pengguna dan bukti masalah yang dapat diakses tim peninjau. Semua hasil tetap harus ditinjau manusia.',
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
                    <Badge
                        variant="outline"
                        className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-extrabold text-muted-foreground"
                    >
                        <Sparkles
                            className="size-3.5 text-primary"
                            aria-hidden="true"
                        />{' '}
                        AI membantu, manusia memutuskan
                    </Badge>
                }
            />
            <div className="grid auto-rows-fr gap-4 md:grid-cols-2">
                {features.map((feature, index) => (
                    <FeatureCard key={index} {...feature} />
                ))}
            </div>
        </Section>
    );
}

export { AIFeatures };
