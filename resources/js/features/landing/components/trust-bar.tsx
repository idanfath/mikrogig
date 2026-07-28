import { FileCheck2, MailCheck, MessageCircleMore, Scale } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';
import { Section } from './ui/section';

interface TrustItem {
    title: string;
    label: string;
    icon?: React.ReactNode;
}

interface TrustBarProps extends React.HTMLAttributes<HTMLElement> {
    items?: TrustItem[];
}

const defaultItems: TrustItem[] = [
    {
        title: 'Email terverifikasi',
        label: 'Setiap akun menyelesaikan verifikasi email sebelum memakai aplikasi.',
        icon: <MailCheck />,
    },
    {
        title: 'Bayaran jelas',
        label: 'Bayaran awal, tawaran, dan total akhir terlihat sebelum pekerjaan dimulai.',
        icon: <Scale />,
    },
    {
        title: 'Kesepakatan tersimpan',
        label: 'Ruang lingkup dan total akhir harus diterima oleh kedua pihak.',
        icon: <FileCheck2 />,
    },
    {
        title: 'Pesan langsung',
        label: 'Pesan, notifikasi, dan perubahan status langsung diperbarui.',
        icon: <MessageCircleMore />,
    },
];

function TrustBar({
    items = defaultItems,
    className,
    ...props
}: TrustBarProps) {
    return (
        <Section
            id="trust-system"
            spacing="sm"
            background="dark"
            className={cn('border-y border-white/8', className)}
            {...props}
        >
            <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <p className="text-xs font-extrabold tracking-[0.12em] text-primary uppercase">
                    Jelas dari tawaran sampai selesai
                </p>
            </div>
            <div className="grid divide-y divide-white/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
                {items.map((item) => (
                    <div
                        key={item.title}
                        className="py-6 sm:px-6 sm:first:pl-0 lg:py-3 lg:first:pl-0"
                    >
                        <span
                            className="grid size-10 place-items-center rounded-xl bg-white/8 text-primary [&_svg]:size-4"
                            aria-hidden="true"
                        >
                            {item.icon}
                        </span>
                        <h2 className="mt-4 text-sm font-extrabold text-white">
                            {item.title}
                        </h2>
                        <p className="mt-2 text-xs leading-5 text-white/48">
                            {item.label}
                        </p>
                    </div>
                ))}
            </div>
        </Section>
    );
}

export { TrustBar };
