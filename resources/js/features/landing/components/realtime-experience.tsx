import {
    BellRing,
    Circle,
    MessageCircleMore,
    Radio,
    RefreshCw,
} from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Card } from './ui/card';
import { Section } from './ui/section';
import { SectionHeader } from './ui/section-header';

interface RealtimeItem {
    title: string;
    description: string;
    icon?: React.ReactNode;
}

interface RealtimeExperienceProps extends Omit<
    React.HTMLAttributes<HTMLElement>,
    'title'
> {
    badge?: React.ReactNode;
    title?: React.ReactNode;
    description?: React.ReactNode;
    items?: RealtimeItem[];
}

const defaultItems: RealtimeItem[] = [
    {
        title: 'Status online dan sedang mengetik',
        description:
            'Peserta percakapan dapat melihat siapa yang sedang online dan kapan lawan bicara sedang mengetik.',
        icon: <Radio className="size-4" />,
    },
    {
        title: 'Perubahan pekerjaan langsung terlihat',
        description:
            'Tawaran, kesepakatan, pembayaran, pekerjaan, masalah, dan rating memperbarui layar yang relevan.',
        icon: <RefreshCw className="size-4" />,
    },
    {
        title: 'Pesan baru muncul di Beranda',
        description:
            'Pesan yang terlewat muncul sebagai tindakan prioritas dan membuka percakapan pada pekerjaan yang tepat.',
        icon: <BellRing className="size-4" />,
    },
];

function RealtimeExperience({
    badge = 'Informasi terbaru tanpa menyegarkan halaman',
    title = 'Percakapan dan status pekerjaan bergerak bersama.',
    description = 'MikroGig membantu kedua pihak melihat kabar terbaru tanpa bolak-balik membuka halaman lain.',
    items = defaultItems,
    className,
    ...props
}: RealtimeExperienceProps) {
    return (
        <Section
            id="realtime"
            background="muted"
            className={cn(className)}
            {...props}
        >
            <SectionHeader
                badge={badge}
                heading={title}
                description={description}
            />
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <Card variant="dark" padding="none" className="overflow-hidden">
                    <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
                        <div>
                            <p className="text-sm font-extrabold text-white">
                                Percakapan pekerjaan
                            </p>
                            <p className="mt-1 text-xs text-white/45">
                                Bantu pindahan kios
                            </p>
                        </div>
                        <Badge variant="dark">
                            <Circle
                                className="fill-success text-success"
                                aria-hidden="true"
                            />
                            Online
                        </Badge>
                    </div>

                    <div className="flex min-h-80 flex-col gap-4 p-5 sm:p-7">
                        <ChatBubble
                            role="Pencari kerja"
                            message="Saya sudah tiba dan siap mulai."
                        />
                        <ChatBubble
                            role="Pemberi kerja"
                            message="Baik, saya buka tahap pekerjaan sekarang."
                            own
                        />
                        <div className="flex items-center gap-3 py-2 text-xs text-white/40">
                            <span className="h-px flex-1 bg-white/10" />
                            Pekerjaan dimulai
                            <span className="h-px flex-1 bg-white/10" />
                        </div>
                        <ChatBubble
                            role="Pencari kerja"
                            message="Barang utama sudah dipindahkan. Saya kirim fotonya di sini."
                        />
                        <p className="flex items-center gap-2 text-xs text-primary">
                            <MessageCircleMore
                                className="size-3.5"
                                aria-hidden="true"
                            />
                            Pemberi kerja sedang mengetik
                        </p>
                    </div>
                </Card>

                <div className="flex flex-col divide-y divide-border border-y border-border">
                    {items.map((item) => (
                        <div
                            key={item.title}
                            className="flex flex-1 gap-4 py-6"
                        >
                            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-primary">
                                {item.icon}
                            </span>
                            <div>
                                <h3 className="font-extrabold tracking-[-0.02em]">
                                    {item.title}
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                    {item.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Section>
    );
}

function ChatBubble({
    role,
    message,
    own = false,
}: {
    role: string;
    message: string;
    own?: boolean;
}) {
    return (
        <div className={cn('max-w-[85%]', own && 'ml-auto')}>
            <div
                className={cn(
                    'rounded-xl px-4 py-3',
                    own ? 'bg-primary text-white' : 'bg-white/8 text-white',
                )}
            >
                <p
                    className={cn(
                        'text-[10px] font-extrabold',
                        own ? 'text-white/75' : 'text-primary',
                    )}
                >
                    {role}
                </p>
                <p className="mt-1 text-sm leading-6">{message}</p>
            </div>
        </div>
    );
}

export { RealtimeExperience };
