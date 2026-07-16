import {
  Calculator,
  Check,
  FileCheck2,
  MapPin,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Card } from './ui/card';
import { Section } from './ui/section';
import { SectionHeader } from './ui/section-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

const wageOptions = {
  cleaning: { label: 'Kebersihan', hourlyRate: 30000 },
  repair: { label: 'Perbaikan rumah', hourlyRate: 50000 },
  event: { label: 'Kru acara', hourlyRate: 35000 },
  moving: { label: 'Bantuan pindahan', hourlyRate: 40000 },
} as const;

type JobKey = keyof typeof wageOptions;

interface FairWageProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  'title'
> {
  badge?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  benefits?: string[];
}

const defaultBenefits = [
  'Tarif dasar dan durasi terlihat',
  'Biaya tambahan harus disetujui',
  'Dana diamankan sebelum pekerjaan dimulai',
];

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

function roundToFiveThousand(value: number) {
  return Math.round(value / 5000) * 5000;
}

function FairWage({
  badge = 'Transparansi, bukan tawar-menawar buta',
  title = 'Upah adil dimulai dari perhitungan yang dapat dipahami.',
  description = 'Simulasi menunjukkan cara MikroGig menyusun rentang upah dari jenis pekerjaan, durasi, dan biaya mobilitas. Angka akhir tetap disepakati kedua pihak.',
  benefits = defaultBenefits,
  className,
  ...props
}: FairWageProps) {
  const [job, setJob] = React.useState<JobKey>('repair');
  const [hours, setHours] = React.useState(3);
  const selectedJob = wageOptions[job];
  const travelAllowance = 20000;
  const estimated = selectedJob.hourlyRate * hours + travelAllowance;
  const minimum = roundToFiveThousand(estimated * 0.9);
  const maximum = roundToFiveThousand(estimated * 1.1);
  const jobId = React.useId();
  const durationId = React.useId();

  return (
    <Section
      id="fair-wage"
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
                <Calculator
                  className="size-3.5"
                  aria-hidden="true"
                />
                Simulasi transparan
              </Badge>
              <h3 className="mt-5 text-2xl font-extrabold tracking-[-0.04em] text-white">
                Coba kalkulator upah
              </h3>
            </div>
            <Badge
              variant="dark"
              className="px-3 py-1 text-[10px] font-bold tracking-[0.08em] text-white/45 uppercase"
            >
              Bukan harga pasar resmi
            </Badge>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor={jobId}
                className="text-xs font-bold text-white/65"
              >
                Jenis pekerjaan
              </label>
              <Select
                value={job}
                onValueChange={(val) => setJob(val as JobKey)}
              >
                <SelectTrigger
                  id={jobId}
                  className="mt-2 h-12 w-full rounded-xl border border-white/12 bg-white/8 px-3 text-sm font-semibold text-white outline-none focus:border-primary focus:ring-3 focus:ring-primary/20 [&_svg]:text-white/60"
                >
                  <SelectValue placeholder="Pilih pekerjaan" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(wageOptions).map(
                    ([key, option]) => (
                      <SelectItem
                        key={key}
                        value={key}
                      >
                        {option.label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor={durationId}
                  className="text-xs font-bold text-white/65"
                >
                  Perkiraan durasi
                </label>
                <span className="text-xs font-extrabold text-primary">
                  {hours} jam
                </span>
              </div>
              <Slider
                id={durationId}
                min={1}
                max={10}
                step={1}
                value={[hours]}
                onValueChange={(val) => setHours(val[0])}
                className="mt-5 w-full"
              />
              <div className="mt-2 flex justify-between text-[10px] text-white/35">
                <span>1 jam</span>
                <span>10 jam</span>
              </div>
            </div>
          </div>

          <div className="mt-7 rounded-2xl border border-white/10 bg-white/7 p-5">
            <p className="text-xs font-bold text-white/50">
              Rentang rekomendasi
            </p>
            <p className="mt-2 text-3xl font-extrabold tracking-tighter text-white sm:text-4xl">
              {formatRupiah(minimum)} –
              {formatRupiah(maximum).replace('Rp', '')}
            </p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/50">
              <span>
                {formatRupiah(selectedJob.hourlyRate)} × {hours}{' '}
                jam
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="size-3" aria-hidden="true" />{' '}
                Mobilitas {formatRupiah(travelAllowance)}
              </span>
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card padding="lg" className="flex-1">
            <div className="flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-success-soft text-success">
                <ShieldCheck
                  className="size-5"
                  aria-hidden="true"
                />
              </span>
              <div>
                <h3 className="text-lg font-extrabold tracking-[-0.025em]">
                  Kesepakatan dilindungi
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Rentang upah menjadi bagian kontrak.
                  Perubahan tugas atau biaya perlu persetujuan
                  kedua pihak dan tercatat.
                </p>
              </div>
            </div>
            <ul className="mt-6 space-y-3">
              {benefits.map((benefit) => (
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

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-xs font-extrabold">
              <FileCheck2
                className="size-4 text-primary"
                aria-hidden="true"
              />{' '}
              Kontrak disetujui
            </div>
            <span
              className="h-px w-6 bg-border"
              aria-hidden="true"
            />
            <div className="flex items-center justify-end gap-2 text-right text-xs font-extrabold text-success">
              <WalletCards
                className="size-4"
                aria-hidden="true"
              />{' '}
              Dana di escrow
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

export { FairWage };
