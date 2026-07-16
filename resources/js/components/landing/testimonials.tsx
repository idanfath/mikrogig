import { FileWarning, Mic2, Scale } from 'lucide-react';
import * as React from 'react';

import { Section } from '@/components/ui/section';
import { SectionHeader } from '@/components/ui/section-header';
import { TestimonialCard } from '@/components/ui/testimonial-card';
import { cn } from '@/lib/utils';

interface TestimonialItem {
    quote: string;
    name: string;
    role: string;
    location?: string;
    avatar?: string;
    rating?: number;
    outcome?: string;
    icon?: React.ReactNode;
}

interface TestimonialsProps extends Omit<
    React.HTMLAttributes<HTMLElement>,
    'title'
> {
    badge?: React.ReactNode;
    title?: React.ReactNode;
    description?: React.ReactNode;
    items?: TestimonialItem[];
}

const defaultTestimonials: TestimonialItem[] = [
    {
        quote: 'Saya berpengalaman bekerja, tetapi belum pernah membuat CV dan kesulitan menulis profil panjang di ponsel.',
        name: 'Pekerja harian',
        role: 'Hambatan: onboarding digital',
        outcome:
            'Voice Onboarding mengubah cerita pengalaman menjadi profil siap digunakan.',
        icon: <Mic2 className="size-4" />,
    },
    {
        quote: 'Tugas bertambah setelah saya datang, tetapi upah yang dijanjikan tetap sama dan kesepakatannya hanya lewat chat.',
        name: 'Pekerja jasa rumah',
        role: 'Hambatan: perubahan ruang lingkup',
        outcome:
            'Kontrak mencatat perubahan tugas dan meminta persetujuan upah dari kedua pihak.',
        icon: <Scale className="size-4" />,
    },
    {
        quote: 'Pekerjaan sudah selesai, tetapi pembayaran tertunda karena tidak ada bukti dan alur penyelesaian masalah yang jelas.',
        name: 'Teknisi panggilan',
        role: 'Hambatan: pembayaran & sengketa',
        outcome:
            'Escrow, bukti kerja, dan kronologi sengketa berada dalam satu alur.',
        icon: <FileWarning className="size-4" />,
    },
];

function Testimonials({
    badge = 'Berangkat dari masalah nyata',
    title = 'Tiga situasi yang ingin MikroGig ubah.',
    description = 'Bagian ini adalah skenario desain untuk menjelaskan hubungan antara masalah pekerja dan solusi produk—bukan testimoni atau klaim pengguna aktif.',
    items = defaultTestimonials,
    className,
    ...props
}: TestimonialsProps) {
    return (
        <Section
            id="user-scenarios"
            background="muted"
            className={cn(className)}
            {...props}
        >
            <SectionHeader
                badge={badge}
                heading={title}
                description={description}
            />
            <div className="grid gap-4 md:grid-cols-3">
                {items.map((item) => (
                    <TestimonialCard
                        key={item.name}
                        name={item.name}
                        role={[item.role, item.location]
                            .filter(Boolean)
                            .join(' · ')}
                        message={item.quote}
                        avatar={item.avatar}
                        rating={item.rating}
                        outcome={item.outcome}
                        icon={item.icon}
                        eyebrow="Skenario rancangan"
                    />
                ))}
            </div>
        </Section>
    );
}

export { Testimonials };
