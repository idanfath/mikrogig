import { useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import toast from 'react-hot-toast';
import { store } from '@/actions/App/Http/Controllers/GigController';
import { AppPage, AppPageCard } from '@/components/layout/app-page';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { EnhanceButton } from '@/components/ui/enhance-button';
import { ImagePicker } from '@/components/ui/image-picker';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useGigEnhance } from '@/features/gigs/hooks/use-gig-enhance';
import { useDetectLocation } from '@/features/regions/hooks/use-detect-location';
import { useRegionSelect } from '@/features/regions/hooks/use-region-select';
import { compressImage } from '@/lib/image_utility';
import { CompressionProfiles } from '@/types/client_enum';
import { getGigCategoryLabel } from '@/types/enum';
import type { GigEstimatedDuration } from '@/types/enum';
import type { WageBenchmarkContext } from '../types';
import {
  WageBenchmark,
  classifyWageBenchmark,
} from './wage-benchmark';

type CreateGigFormProps = {
  categories: string[];
  today: string;
  default_province_id?: string | null;
  default_regency_id?: string | null;
  wage_benchmark_context: WageBenchmarkContext;
};

export function CreateGigForm({
  categories,
  today,
  default_province_id,
  default_regency_id,
  wage_benchmark_context: wageBenchmarkContext,
}: CreateGigFormProps) {
  const form = useForm({
    title: '',
    description: '',
    category: '',
    province_id: default_province_id ?? '',
    regency_id: default_regency_id ?? '',
    location_address: '',
    location_latitude: '',
    location_longitude: '',
    location_accuracy_meters: '',
    work_date: today,
    start_time: '',
    posted_fee: '',
    estimated_duration: '' as GigEstimatedDuration | '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  // photos stay out of the inertia form. setData deep-clones the whole form on every keystroke,
  // which replaced every File object and churned the preview blob urls
  const [photos, setPhotos] = useState<File[]>([]);
  const { detectLocation } = useDetectLocation();
  const { provinces, regencies } = useRegionSelect({
    provinceId: form.data.province_id,
    regencyId: form.data.regency_id,
  });
  useEffect(() => {
    detectLocation((location) => {
      form.setData((data) => ({
        ...data,
        location_latitude:
          location.latitude?.toString() ?? data.location_latitude,
        location_longitude:
          location.longitude?.toString() ?? data.location_longitude,
        location_accuracy_meters: location.accuracy
          ? Math.round(location.accuracy).toString()
          : data.location_accuracy_meters,
      }));
    });
  }, []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    form.transform((data) => ({ ...data, photos }));
    form.post(store.url(), {
      forceFormData: true,
      onError: () => {
        toast.error('Gagal menerbitkan Gig. Periksa pesan kesalahan pada formulir.');
      },
    });
  };

  const photoError = Object.entries(form.errors).find(
    ([key]) => key === 'photos' || key.startsWith('photos.'),
  )?.[1];

  const error = (key: keyof typeof form.errors) =>
    form.errors[key] && (
      <p className="text-sm text-destructive">{form.errors[key]}</p>
    );

  const wageRange =
    form.data.province_id && form.data.estimated_duration
      ? wageBenchmarkContext.provinces[form.data.province_id]?.[
          form.data.estimated_duration
        ]
      : undefined;
  const wageStatus =
    wageRange && form.data.posted_fee !== ''
      ? classifyWageBenchmark(Number(form.data.posted_fee), wageRange)
      : undefined;
  const isWageBenchmarkUnavailable =
    Boolean(form.data.province_id && form.data.estimated_duration) &&
    !wageRange;

  const {
    enhancingTitle,
    enhancingDescription,
    canEnhanceTitle,
    canEnhanceDescription,
    enhanceTitle,
    enhanceDescription,
  } = useGigEnhance({
    title: form.data.title,
    description: form.data.description,
    category: form.data.category,
    formProcessing: form.processing,
    onTitleChange: (val) => form.setData('title', val),
    onDescriptionChange: (val) => form.setData('description', val),
  });

  return (
    <AppPage
      title="Buat Gig"
      description="Isi detail pekerjaan mikro yang ingin Anda publikasikan untuk menemukan pekerja lokal terbaik."
    >
      <form onSubmit={submit} className="flex flex-col gap-6">
        <AppPageCard className="grid gap-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Judul Pekerjaan</span>
              <EnhanceButton
                available={canEnhanceTitle}
                loading={enhancingTitle}
                idleLabel="Tingkatkan Judul dengan AI"
                onClick={enhanceTitle}
              />
            </div>
            <Input
              placeholder="Masukkan Judul Pekerjaan"
              value={form.data.title}
              onChange={(e) => form.setData('title', e.target.value)}
              disabled={form.processing || enhancingTitle}
              mobileLarge
            />
            {error('title')}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Deskripsi Pekerjaan</span>
              <EnhanceButton
                available={canEnhanceDescription}
                loading={enhancingDescription}
                idleLabel="Tingkatkan Deskripsi dengan AI"
                onClick={enhanceDescription}
              />
            </div>
            <Textarea
              placeholder="Jelaskan detail pekerjaan, kebutuhan, dan syarat"
              value={form.data.description}
              onChange={(e) => form.setData('description', e.target.value)}
              disabled={form.processing || enhancingDescription}
            />
            {error('description')}
          </div>
          <div>
            <div className="mb-1.5">
              <span className="text-sm font-medium">Kategori Pekerjaan</span>
            </div>
            <Select
              value={form.data.category}
              onValueChange={(val) => form.setData('category', val)}
            >
              <SelectTrigger className="w-full" mobileLarge>
                <SelectValue placeholder="Pilih Kategori Pekerjaan" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {getGigCategoryLabel(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error('category')}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1.5">
                <span className="text-sm font-medium">Provinsi</span>
              </div>
              <Select
                value={form.data.province_id}
                onValueChange={(val) =>
                  form.setData({
                    ...form.data,
                    province_id: val,
                    regency_id: '',
                  })
                }
              >
                <SelectTrigger className="w-full" mobileLarge>
                  <SelectValue placeholder="Pilih Provinsi" />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((province) => (
                    <SelectItem key={province.id} value={province.id}>
                      {province.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {error('province_id')}
            </div>

            <div>
              <div className="mb-1.5">
                <span className="text-sm font-medium">Kabupaten / Kota</span>
              </div>
              <Select
                value={form.data.regency_id}
                onValueChange={(val) => form.setData('regency_id', val)}
              >
                <SelectTrigger className="w-full" mobileLarge>
                  <SelectValue placeholder="Pilih Kabupaten/Kota" />
                </SelectTrigger>
                <SelectContent>
                  {regencies.map((regency) => (
                    <SelectItem key={regency.id} value={regency.id}>
                      {regency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {error('regency_id')}
            </div>
          </div>

          <div>
            <div className="mb-1.5">
              <span className="text-sm font-medium">Alamat Lengkap</span>
            </div>
            <Textarea
              placeholder="Alamat lengkap lokasi pekerjaan"
              value={form.data.location_address}
              onChange={(e) => form.setData('location_address', e.target.value)}
            />
            {error('location_address')}
          </div>
          <input
            type="hidden"
            name="location_latitude"
            value={form.data.location_latitude}
          />
          <input
            type="hidden"
            name="location_longitude"
            value={form.data.location_longitude}
          />
          <input
            type="hidden"
            name="location_accuracy_meters"
            value={form.data.location_accuracy_meters}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1.5">
                <span className="text-sm font-medium">Tanggal Kerja</span>
              </div>
              <DatePicker
                value={form.data.work_date}
                onChange={(val) => form.setData('work_date', val)}
                minDate={new Date()}
                placeholder="Pilih tanggal kerja"
                mobileLarge
              />
              {error('work_date')}
            </div>

            <div>
              <div className="mb-1.5">
                <span className="text-sm font-medium">Waktu Mulai</span>
              </div>
              <Input
                type="time"
                value={form.data.start_time}
                onChange={(e) => form.setData('start_time', e.target.value)}
                mobileLarge
              />
              {error('start_time')}
            </div>

            <div>
              <div className="mb-1.5">
                <span className="text-sm font-medium">
                  Estimasi Durasi Pekerjaan
                </span>
              </div>
              <Select
                value={form.data.estimated_duration}
                onValueChange={(value) =>
                  form.setData(
                    'estimated_duration',
                    value as GigEstimatedDuration,
                  )
                }
              >
                <SelectTrigger className="w-full" mobileLarge>
                  <SelectValue placeholder="Pilih estimasi durasi" />
                </SelectTrigger>
                <SelectContent>
                  {wageBenchmarkContext.durations.map((duration) => (
                    <SelectItem key={duration.value} value={duration.value}>
                      {duration.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {error('estimated_duration')}
            </div>

            <div>
              <div className="mb-1.5">
                <span className="text-sm font-medium">Biaya Pekerjaan</span>
              </div>
              <InputGroup mobileLarge>
                <InputGroupAddon align="inline-start">Rp</InputGroupAddon>
                <InputGroupInput
                  type="text"
                  inputMode="numeric"
                  placeholder="Biaya"
                  value={
                    form.data.posted_fee !== ''
                      ? Number(form.data.posted_fee).toLocaleString('id-ID')
                      : ''
                  }
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    form.setData('posted_fee', raw);
                  }}
                  mobileLarge
                />
              </InputGroup>
              {error('posted_fee')}
            </div>
          </div>
          {wageRange && form.data.estimated_duration && (
            <WageBenchmark
              duration={form.data.estimated_duration}
              range={wageRange}
              context={wageBenchmarkContext}
              status={wageStatus}
              showDisclaimer
            />
          )}
          {isWageBenchmarkUnavailable && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3.5 text-xs text-destructive">
              Acuan upah untuk provinsi ini belum tersedia. Pilih provinsi lain
              atau coba lagi nanti.
            </div>
          )}
          <ImagePicker
            files={photos}
            onFilesChange={setPhotos}
            label="Foto pekerjaan"
            description="JPEG, PNG, atau WebP. Maksimal 5 foto, masing-masing 5 MB."
            error={photoError}
            maxFiles={5}
            maxBytes={5 * 1024 * 1024}
            maxDimensions={{ width: 12000, height: 12000 }}
            disabled={form.processing}
            transformFile={(file) =>
              compressImage(file, CompressionProfiles.GigPhoto)
            }
          />
          {form.progress && (
            <progress value={form.progress.percentage} max="100">
              {form.progress.percentage}%
            </progress>
          )}
          <Button type="submit" mobileLarge disabled={form.processing}>
            {form.processing ? 'Mengirim...' : 'Terbitkan Gig'}
          </Button>
        </AppPageCard>
      </form>
    </AppPage>
  );
}
