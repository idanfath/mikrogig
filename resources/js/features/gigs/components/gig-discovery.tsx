import { router } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { AppPage, AppPageCard } from '@/components/layout/app-page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRegionSelect } from '@/features/regions/hooks/use-region-select';
import { index } from '@/routes/app/gigs';
import type { Gig, Paginated } from '../types';
import { GigCard } from './gig-card';
import { Pagination } from './pagination';
import { getGigCategoryLabel } from '@/types/enum';

type Filters = {
  province_id?: string;
  regency_id?: string;
  category?: string;
  date_from?: string;
  date_to?: string;
  minimum_fee?: string;
  maximum_fee?: string;
};
export function GigDiscovery({
  gigs,
  filters,
  categories,
}: {
  gigs: Paginated<Gig>;
  filters: Filters;
  categories: string[];
}) {
  const [data, setData] = useState<Filters>(filters);
  const { provinces, regencies } = useRegionSelect({
    provinceId: data.province_id ?? '',
    regencyId: data.regency_id ?? '',
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    router.get(
      index.url({ query: data }),
      {},
      { preserveScroll: true, preserveState: true },
    );
  };

  return (
    <AppPage title="Cari Gig">
      <div className="flex flex-col gap-6">
        <AppPageCard>
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
            <select
              className="h-9 rounded-md border bg-background px-2"
              value={data.province_id ?? ''}
              onChange={(e) =>
                setData({
                  ...data,
                  province_id: e.target.value,
                  regency_id: '',
                })
              }
            >
              <option value="">Semua provinsi</option>
              {provinces.map((province) => (
                <option key={province.id} value={province.id}>
                  {province.name}
                </option>
              ))}
            </select>
            <select
              className="h-9 rounded-md border bg-background px-2"
              value={data.regency_id ?? ''}
              onChange={(e) => setData({ ...data, regency_id: e.target.value })}
            >
              <option value="">Semua kabupaten/kota</option>
              {regencies.map((regency) => (
                <option key={regency.id} value={regency.id}>
                  {regency.name}
                </option>
              ))}
            </select>
            <select
              className="h-9 rounded-md border bg-background px-2"
              value={data.category ?? ''}
              onChange={(e) => setData({ ...data, category: e.target.value })}
            >
              <option value="">Semua kategori</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {getGigCategoryLabel(category)}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={data.date_from ?? ''}
                onChange={(e) =>
                  setData({ ...data, date_from: e.target.value })
                }
              />
              <Input
                type="date"
                value={data.date_to ?? ''}
                onChange={(e) => setData({ ...data, date_to: e.target.value })}
              />
            </div>
            <Input
              type="number"
              min="1000"
              placeholder="Biaya minimum"
              value={data.minimum_fee ?? ''}
              onChange={(e) =>
                setData({ ...data, minimum_fee: e.target.value })
              }
            />
            <Input
              type="number"
              min="1000"
              placeholder="Biaya maksimum"
              value={data.maximum_fee ?? ''}
              onChange={(e) =>
                setData({ ...data, maximum_fee: e.target.value })
              }
            />
            <Button type="submit">Terapkan filter</Button>
          </form>
        </AppPageCard>
        <div className="grid gap-4 md:grid-cols-2">
          {gigs.data.map((gig) => (
            <GigCard key={gig.id} gig={gig} />
          ))}
        </div>
        {gigs.data.length === 0 && (
          <AppPageCard>Tidak ada gig yang sesuai.</AppPageCard>
        )}
        <Pagination page={gigs} />
      </div>
    </AppPage>
  );
}
