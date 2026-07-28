import { ChevronDown } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';
import { Section } from './ui/section';

interface FAQItem {
    question: string;
    answer: React.ReactNode;
}

interface FAQProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
    title?: React.ReactNode;
    description?: React.ReactNode;
    items?: FAQItem[];
}

const defaultItems: FAQItem[] = [
    {
        question: 'Siapa yang dapat menggunakan MikroGig?',
        answer: 'MikroGig dirancang untuk orang yang mencari kerja dan orang yang membutuhkan bantuan di sekitar mereka. Kamu dapat memasang pekerjaan atau mencari pekerjaan lalu mengajukan bayaran. Saat ini, pekerjaan mencakup tenaga kerja, pembersihan, pindahan, konstruksi, dan keamanan.',
    },
    {
        question: 'Bagaimana MikroGig mendukung upah yang lebih adil?',
        answer: 'MikroGig tidak menentukan harga pasar atau upah minimum. Bayaran awal, tawaran dari pencari kerja, ruang lingkup, dan total akhir ditampilkan serta harus disepakati sebelum pekerjaan dimulai. Riwayat ini mencegah perubahan sepihak tanpa jejak.',
    },
    {
        question: 'Apakah pembayaran di aplikasi memindahkan uang asli?',
        answer: 'Belum. Pembayaran di aplikasi saat ini masih contoh alur dan belum memindahkan uang asli. Tahap pembayaran ditampilkan agar alur pekerjaan mudah dipahami. Pembayaran sungguhan dapat ditambahkan kemudian.',
    },
    {
        question: 'Apa yang terjadi jika muncul sengketa?',
        answer: 'Orang yang melapor dapat mengunggah bukti privat, lalu pihak lain mendapat kesempatan mengirim bukti tandingan. Tim peninjau melihat kesepakatan, pesan, foto, dan riwayat pekerjaan. Ringkasan AI hanya membantu menyusun bukti, sedangkan keputusan tetap dibuat manusia.',
    },
    {
        question: 'Apa yang dapat dilakukan AI MikroGig?',
        answer: 'AI dapat membantu merapikan judul dan profil pencari kerja, menyarankan keahlian, memperjelas kebutuhan pekerjaan, dan membuat ringkasan bukti untuk tim peninjau. AI tidak menentukan upah atau pihak yang bersalah.',
    },
    {
        question: 'Apakah pesan dan status diperbarui langsung?',
        answer: 'Ya. Pesan, status online, indikator sedang mengetik, notifikasi, perubahan pekerjaan, dan tindakan di Beranda diperbarui saat ada perubahan. Saat koneksi kembali, data diperbarui lagi.',
    },
];

function FAQ({
    title = 'Yang bisa dilakukan MikroGig, dijelaskan dengan jelas.',
    description = 'Lihat alur yang sudah dapat dicoba dan bagian yang masih berupa contoh.',
    items = defaultItems,
    className,
    ...props
}: FAQProps) {
    const [openIndex, setOpenIndex] = React.useState<number | null>(0);
    const idPrefix = React.useId();

    return (
        <Section id="faq" className={cn(className)} {...props}>
            <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
                <div className="lg:sticky lg:top-28 lg:self-start">
                    <h2 className="mt-5 text-3xl leading-[1.08] font-extrabold tracking-[-0.045em] text-balance sm:text-4xl">
                        {title}
                    </h2>
                    <p className="mt-4 text-base leading-7 text-pretty text-muted-foreground">
                        {description}
                    </p>
                    <a
                        href="#mulai"
                        className="mt-7 inline-flex rounded-lg text-sm font-extrabold text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/25"
                    >
                        Masih ragu? Lihat pilihan untuk mulai
                    </a>
                </div>

                <div className="divide-y divide-border border-y border-border">
                    {items.map((item, index) => {
                        const isOpen = openIndex === index;
                        const buttonId = `${idPrefix}-button-${index}`;
                        const panelId = `${idPrefix}-panel-${index}`;

                        return (
                            <div key={item.question}>
                                <h3>
                                    <button
                                        id={buttonId}
                                        type="button"
                                        onClick={() =>
                                            setOpenIndex(isOpen ? null : index)
                                        }
                                        className="flex w-full items-center justify-between gap-5 py-6 text-left text-base font-extrabold tracking-[-0.015em] outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/25 focus-visible:ring-inset sm:text-lg"
                                        aria-expanded={isOpen}
                                        aria-controls={panelId}
                                    >
                                        {item.question}
                                        <span
                                            className={cn(
                                                'grid size-9 shrink-0 place-items-center rounded-full bg-secondary transition-transform',
                                                isOpen &&
                                                'rotate-180 bg-accent text-primary',
                                            )}
                                        >
                                            <ChevronDown
                                                className="size-4"
                                                aria-hidden="true"
                                            />
                                        </span>
                                    </button>
                                </h3>
                                {isOpen && (
                                    <div
                                        id={panelId}
                                        role="region"
                                        aria-labelledby={buttonId}
                                        className="pr-12 pb-6 text-sm leading-7 text-muted-foreground sm:text-base"
                                    >
                                        {item.answer}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </Section>
    );
}

export { FAQ };
