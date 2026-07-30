import {
    Check,
    CircleDollarSign,
    FileCheck2,
    Images,
    ShieldCheck,
} from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Card } from './ui/card';
import { Section } from './ui/section';
import { SectionHeader } from './ui/section-header';

interface WorkProtectionProps extends Omit<
    React.HTMLAttributes<HTMLElement>,
    'title'
> {
    badge?: React.ReactNode;
    title?: React.ReactNode;
    description?: React.ReactNode;
}

const agreementStages = [
    {
        label: 'Estimasi durasi & acuan upah',
        value: '4–6 jam',
        description: 'Rentang acuan dihitung dari UMP provinsi dan durasi kerja.',
    },
    {
        label: 'Bayaran awal pekerjaan',
        value: 'Rp350.000',
        description: 'Terlihat saat pencari kerja menilai pekerjaan.',
    },
    {
        label: 'Tawaran pencari kerja',
        value: 'Rp375.000',
        description: 'Pencari kerja bebas mengajukan bayaran yang sesuai.',
    },
    {
        label: 'Total akhir',
        value: 'Rp365.000',
        description: 'Ruang lingkup dan seluruh biaya diterima kedua pihak.',
    },
    {
        label: 'Pembayaran demo',
        value: 'Terkonfirmasi',
        description: 'Pekerjaan dapat dimulai setelah dikonfirmasi.',
    },
];

function WorkProtection({
    badge = 'Perlindungan upah yang benar-benar tersedia',
    title = 'Upah lebih adil dan tidak berubah diam-diam.',
    description = 'MikroGig memberi Acuan Upah berdasarkan UMP dan estimasi durasi. Bayaran awal, tawaran pencari kerja, dan total akhir tetap terlihat serta tercatat sebelum pekerjaan dimulai.',
    className,
    ...props
}: WorkProtectionProps) {
    return (
        <Section
            id="protection"
            background="warm"
            className={cn(className)}
            {...props}
        >
            <SectionHeader
                badge={badge}
                heading={title}
                description={description}
            />

            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
                <Card variant="dark" padding="lg" className="overflow-hidden">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <Badge variant="dark">
                                <CircleDollarSign
                                    className="size-3.5"
                                    aria-hidden="true"
                                />
                                Contoh kesepakatan
                            </Badge>
                            <h3 className="mt-5 text-2xl font-extrabold tracking-[-0.04em] text-white">
                                Semua angka punya jejak
                            </h3>
                        </div>
                    </div>

                    <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
                        {agreementStages.map((stage) => (
                            <div
                                key={stage.label}
                                className="grid gap-2 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
                            >
                                <div>
                                    <p className="text-sm font-extrabold text-white">
                                        {stage.label}
                                    </p>
                                    <p className="mt-1 text-xs leading-5 text-white/48">
                                        {stage.description}
                                    </p>
                                </div>
                                <p className="text-sm font-extrabold text-primary">
                                    {stage.value}
                                </p>
                            </div>
                        ))}
                    </div>
                </Card>

                <div className="flex flex-col gap-4">
                    <Card padding="lg" className="flex-1">
                        <div className="flex items-start gap-4">
                            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-success-soft text-success">
                                <FileCheck2
                                    className="size-5"
                                    aria-hidden="true"
                                />
                            </span>
                            <div>
                                <h3 className="text-lg font-extrabold tracking-[-0.025em]">
                                    Tidak berubah sepihak
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                    Total akhir mencakup seluruh biaya yang
                                    disepakati. Kedua pihak harus menerima versi
                                    kesepakatan yang sama.
                                </p>
                            </div>
                        </div>
                        <ul className="mt-6 space-y-3">
                            {[
                                'Acuan upah mengikuti UMP dan estimasi durasi',
                                'Biaya awal terlihat sebelum melamar',
                                'Tawaran pencari kerja disimpan',
                                'Total akhir mengikuti kesepakatan aktif',
                            ].map((benefit) => (
                                <li
                                    key={benefit}
                                    className="flex items-center gap-3 text-sm font-semibold"
                                >
                                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-success-soft text-success">
                                        <Check
                                            className="size-3"
                                            aria-hidden="true"
                                        />
                                    </span>
                                    {benefit}
                                </li>
                            ))}
                        </ul>
                    </Card>

                    <Card padding="lg">
                        <div className="flex items-start gap-4">
                            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-primary">
                                <ShieldCheck
                                    className="size-5"
                                    aria-hidden="true"
                                />
                            </span>
                            <div>
                                <h3 className="text-lg font-extrabold tracking-[-0.025em]">
                                    Jika pekerjaan bermasalah
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                    Bukti laporan, bukti tandingan, chat,
                                    kesepakatan, dan foto dirangkum untuk
                                    tinjauan admin dan penyelesaian yang
                                    tercatat.
                                </p>
                                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                    <Images
                                        className="size-4 text-primary"
                                        aria-hidden="true"
                                    />
                                    Bukti privat dengan akses terbatas
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </Section>
    );
}

export { WorkProtection };
