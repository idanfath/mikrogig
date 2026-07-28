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
        answer: 'MikroGig dirancang untuk freelancer informal dan pemberi kerja lokal. Client membuat gig, sedangkan freelancer mencari pekerjaan dan mengajukan penawaran. Kategori saat ini mencakup tenaga kerja, pembersihan, pindahan, konstruksi, dan keamanan.',
    },
    {
        question: 'Bagaimana MikroGig mendukung upah yang lebih adil?',
        answer: 'MikroGig tidak menentukan harga pasar atau upah minimum. Biaya awal, penawaran freelancer, ruang lingkup, dan total akhir ditampilkan serta harus disepakati sebelum pekerjaan dimulai. Riwayat ini mencegah perubahan sepihak tanpa jejak.',
    },
    {
        question: 'Apakah pembayaran di aplikasi memindahkan uang asli?',
        answer: 'Belum. Checkout saat ini adalah simulasi untuk hackathon dan tidak memindahkan uang asli. Alur status pembayaran, penguncian gig, payout, serta refund sudah disiapkan di balik antarmuka gateway agar integrasi penyedia pembayaran dapat ditambahkan kemudian.',
    },
    {
        question: 'Apa yang terjadi jika muncul sengketa?',
        answer: 'Pelapor mengunggah bukti privat, pihak lain mendapat kesempatan mengirim bukti tandingan, lalu admin meninjau kesepakatan, chat, foto, dan riwayat gig. Ringkasan AI hanya membantu menyusun bukti. Putusan dan penyelesaian tetap dibuat admin.',
    },
    {
        question: 'Apa yang dapat dilakukan AI MikroGig?',
        answer: 'AI dapat meningkatkan judul dan bio freelancer, menyarankan keahlian, memperjelas judul serta deskripsi gig, dan membuat ringkasan bukti sengketa untuk admin. AI tidak menentukan upah atau pihak yang bersalah.',
    },
    {
        question: 'Apakah chat dan status diperbarui secara realtime?',
        answer: 'Ya. Pesan, status online, indikator mengetik, tanda baca, notifikasi, perubahan gig, dan tindakan Beranda menggunakan pembaruan realtime. Sistem menyinkronkan ulang data saat koneksi kembali.',
    },
];

function FAQ({
    title = 'Kemampuan dan batas produk dijelaskan sejak awal.',
    description = 'MikroGig menunjukkan alur yang sudah dapat dicoba sekaligus membedakan fitur produksi dari simulasi hackathon.',
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
