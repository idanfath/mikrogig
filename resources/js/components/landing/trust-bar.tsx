import { FileCheck2, Fingerprint, Scale, WalletCards } from 'lucide-react';
import * as React from 'react';

import { Section } from '@/components/ui/section';
import { cn } from '@/lib/utils';

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
        title: 'Verifikasi dua arah',
        label: 'Pekerja dan pemberi kerja membangun identitas tepercaya.',
        icon: <Fingerprint />,
    },
    {
        title: 'Upah terlihat di awal',
        label: 'Ruang lingkup, durasi, dan rentang upah dibuka sebelum menerima.',
        icon: <Scale />,
    },
    {
        title: 'Kontrak ringkas',
        label: 'Kesepakatan kerja mudah dibaca dan fleksibel untuk gig harian.',
        icon: <FileCheck2 />,
    },
    {
        title: 'Escrow pembayaran',
        label: 'Dana diamankan sebelum mulai dan dilepas setelah pekerjaan selesai.',
        icon: <WalletCards />,
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
                <p className="text-xs font-extrabold tracking-[0.12em] text-brand uppercase">
                    Perlindungan dari awal sampai dibayar
                </p>
                <p className="max-w-md text-sm leading-6 text-white/50">
                    Bukan hanya tempat mencari kerja—setiap tahap dirancang
                    untuk mengurangi ketidakpastian.
                </p>
            </div>
            <div className="grid divide-y divide-white/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
                {items.map((item) => (
                    <div
                        key={item.title}
                        className="py-6 sm:px-6 sm:first:pl-0 lg:py-3 lg:first:pl-0"
                    >
                        <span
                            className="grid size-10 place-items-center rounded-xl bg-white/8 text-brand [&_svg]:size-4"
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
