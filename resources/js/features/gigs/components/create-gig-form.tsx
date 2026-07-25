import { useForm } from '@inertiajs/react';
import { Loader2, MapPin } from 'lucide-react';
import { useEffect, useState  } from 'react';
import { getGigCategoryLabel } from '@/types/enum';
import type {FormEvent} from 'react';
import { store } from '@/actions/App/Http/Controllers/GigController';
import { AppPage, AppPageCard } from '@/components/layout/app-page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useDetectLocation } from '@/features/regions/hooks/use-detect-location';
import { useRegionSelect } from '@/features/regions/hooks/use-region-select';

type CreateGigFormProps = { categories: string[]; today: string };

export function CreateGigForm({ categories, today }: CreateGigFormProps) {
  const form = useForm({
    title: '',
    description: '',
    category: '',
    province_id: '',
    regency_id: '',
    location_address: '',
    location_latitude: '',
    location_longitude: '',
    location_accuracy_meters: '',
    work_date: today,
    start_time: '',
    posted_fee: '',
    photos: [] as File[],
  });
  const [previews, setPreviews] = useState<string[]>([]);
  const { detecting, detectLocation } = useDetectLocation();
  const { provinces, regencies } = useRegionSelect({
    provinceId: form.data.province_id,
    regencyId: form.data.regency_id,
  });
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);

  const selectPhotos = (files: FileList | null) => {
    const selected = Array.from(files ?? []).slice(0, 5);
    previews.forEach(URL.revokeObjectURL);
    setPreviews(selected.map((file) => URL.createObjectURL(file)));
    form.setData('photos', selected);
  };
  const removePhoto = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setPreviews((items) => items.filter((_, itemIndex) => itemIndex !== index));
    form.setData(
      'photos',
      form.data.photos.filter((_, itemIndex) => itemIndex !== index),
    );
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    form.post(store.url(), { forceFormData: true });
  };
  const error = (key: keyof typeof form.errors) =>
    form.errors[key] && (
      <p className="text-sm text-destructive">{form.errors[key]}</p>
    );

  return (
    <AppPage title="Buat Gig">
      <form onSubmit={submit} className="flex flex-col gap-6">
        <AppPageCard className="grid gap-4">
          <Input
            placeholder="Judul"
            value={form.data.title}
            onChange={(e) => form.setData('title', e.target.value)}
          />
          {error('title')}
          <Textarea
            placeholder="Deskripsi"
            value={form.data.description}
            onChange={(e) => form.setData('description', e.target.value)}
          />
          {error('description')}
          <select
            className="h-9 rounded-md border bg-background px-2"
            value={form.data.category}
            onChange={(e) => form.setData('category', e.target.value)}
          >
            <option value="">Kategori</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {getGigCategoryLabel(category)}
              </option>
            ))}
          </select>
          {error('category')}
          <select
            className="h-9 rounded-md border bg-background px-2"
            value={form.data.province_id}
            onChange={(e) =>
              form.setData({
                ...form.data,
                province_id: e.target.value,
                regency_id: '',
              })
            }
          >
            <option value="">Provinsi</option>
            {provinces.map((province) => (
              <option key={province.id} value={province.id}>
                {province.name}
              </option>
            ))}
          </select>
          {error('province_id')}
          <select
            className="h-9 rounded-md border bg-background px-2"
            value={form.data.regency_id}
            onChange={(e) => form.setData('regency_id', e.target.value)}
          >
            <option value="">Kabupaten/kota</option>
            {regencies.map((regency) => (
              <option key={regency.id} value={regency.id}>
                {regency.name}
              </option>
            ))}
          </select>
          {error('regency_id')}
          <Textarea
            placeholder="Alamat lengkap"
            value={form.data.location_address}
            onChange={(e) => form.setData('location_address', e.target.value)}
          />
          {error('location_address')}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              detectLocation((location) => {
                form.setData((data) => ({
                  ...data,
                  province_id: location.province_id,
                  regency_id: location.regency_id,
                  location_latitude:
                    location.latitude?.toString() ?? data.location_latitude,
                  location_longitude:
                    location.longitude?.toString() ?? data.location_longitude,
                  location_accuracy_meters:
                    location.accuracy?.toString() ??
                    data.location_accuracy_meters,
                }));
              })
            }
            disabled={detecting}
            className="w-full"
          >
            {detecting ? (
              <Loader2
                className="animate-spin text-primary"
                data-icon="inline-start"
              />
            ) : (
              <MapPin className="text-primary" data-icon="inline-start" />
            )}
            {detecting ? 'Mendeteksi Lokasi...' : 'Gunakan Lokasi Saat Ini (GPS)'}
          </Button>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              type="number"
              step="any"
              placeholder="Latitude opsional"
              value={form.data.location_latitude}
              onChange={(e) =>
                form.setData('location_latitude', e.target.value)
              }
            />
            <Input
              type="number"
              step="any"
              placeholder="Longitude opsional"
              value={form.data.location_longitude}
              onChange={(e) =>
                form.setData('location_longitude', e.target.value)
              }
            />
          </div>
          <Input
            type="number"
            placeholder="Akurasi meter opsional"
            value={form.data.location_accuracy_meters}
            onChange={(e) =>
              form.setData('location_accuracy_meters', e.target.value)
            }
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              type="date"
              min={today}
              value={form.data.work_date}
              onChange={(e) => form.setData('work_date', e.target.value)}
            />
            <Input
              type="time"
              value={form.data.start_time}
              onChange={(e) => form.setData('start_time', e.target.value)}
            />
            <Input
              type="number"
              min="1000"
              placeholder="Biaya Rp"
              value={form.data.posted_fee}
              onChange={(e) => form.setData('posted_fee', e.target.value)}
            />
          </div>
          {error('work_date')}
          {error('start_time')}
          {error('posted_fee')}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => selectPhotos(e.target.files)}
          />
          {error('photos')}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {previews.map((preview, index) => (
              <div key={preview} className="relative">
                <img
                  src={preview}
                  alt="Pratinjau foto"
                  className="aspect-square w-full rounded object-cover"
                />
                <Button
                  type="button"
                  size="xs"
                  variant="destructive"
                  className="absolute top-1 right-1"
                  onClick={() => removePhoto(index)}
                >
                  Hapus
                </Button>
              </div>
            ))}
          </div>
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
