import { ChevronDown, HelpCircle } from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Section } from './ui/section';
import { cn } from '@/lib/utils';

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
    answer: 'MikroGig dirancang untuk pekerja informal dan pemberi kerja lokal: mulai dari jasa kebersihan, teknisi panggilan, tenaga harian, pindahan, hingga kru acara. Prototipe memprioritaskan pekerjaan berbasis lokasi dan durasi singkat.',
  },
  {
    question: 'Bagaimana escrow melindungi pembayaran?',
    answer: 'Sebelum pekerjaan dimulai, dana dari pemberi kerja diamankan di sistem. Setelah bukti penyelesaian disetujui, dana dilepas kepada pekerja. Bila ada keberatan, dana tetap ditahan sampai proses tinjauan selesai.',
  },
  {
    question: 'Apakah rekomendasi upah bersifat wajib?',
    answer: 'Tidak. Kalkulator memberikan rentang transparan berdasarkan jenis pekerjaan, durasi, lokasi, dan faktor risiko. Nilai akhir tetap disepakati oleh pekerja dan pemberi kerja, lalu dicatat dalam kontrak.',
  },
  {
    question: 'Apa yang terjadi jika muncul sengketa?',
    answer: 'Kedua pihak dapat mengunggah bukti. Sistem menyusun kontrak, chat, waktu, lokasi, dan foto menjadi kronologi. AI hanya membantu merapikan bukti; keputusan tetap ditinjau manusia.',
  },
  {
    question: 'Apakah pengguna harus pandai mengetik?',
    answer: 'Tidak. Voice Onboarding memungkinkan pengguna menjawab pertanyaan dengan suara. Sistem membantu menyusun profil, mencari gig, dan menjelaskan kontrak dalam bahasa yang lebih sederhana.',
  },
  {
    question: 'Bagaimana data identitas dijaga?',
    answer: 'Konsep produk menerapkan verifikasi seperlunya, pemisahan data sensitif, kontrol akses, dan penyamaran informasi pribadi pada tampilan publik. Detail implementasi produksi akan mengikuti regulasi perlindungan data yang berlaku.',
  },
];

function FAQ({
  title = 'Jelas sejak awal, bukan setelah terjadi masalah.',
  description = 'Kepercayaan dibangun ketika aturan, risiko, dan batas teknologi dijelaskan dengan bahasa yang mudah dipahami.',
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
