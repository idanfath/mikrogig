import { router } from '@inertiajs/react';
import { SearchX, X } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { AppPage, AppPageCard } from '@/components/layout/app-page';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { ListToolbar } from '@/components/ui/list-toolbar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRegionSelect } from '@/features/regions/hooks/use-region-select';
import { index } from '@/routes/app/gigs';
import { getGigCategoryLabel } from '@/types/enum';
import type { Gig, Paginated } from '../types';
import { GigCard } from './gig-card';
import { Pagination } from './pagination';

type Filters = {
  search?: string;
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

  const hasActiveFilters = Boolean(
    data.search ||
    data.province_id ||
    data.regency_id ||
    data.category ||
    data.date_from ||
    data.date_to ||
    data.minimum_fee ||
    data.maximum_fee,
  );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    router.get(
      index.url({ query: data }),
      {},
      { preserveScroll: true, preserveState: true },
    );
  };

  const resetFilters = () => {
    setData({});
    router.get(
      index.url(),
      {},
      { preserveScroll: true, preserveState: true },
    );
  };

  return (
    <AppPage
      title="Cari Gig"
      description="Jelajahi pekerjaan mikro lokal yang tersedia, saring berdasarkan lokasi & kategori, lalu ajukan penawaran Anda."
    >
      <div className="flex flex-col gap-6">
        <AppPageCard>
          <form onSubmit={submit} className="flex flex-col">
            <ListToolbar
              search={data.search ?? ''}
              onSearchChange={(value) => setData({ ...data, search: value })}
              placeholder="Cari judul atau deskripsi..."
              filterLabel="Filter lanjutan"
              hasActiveFilters={hasActiveFilters}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Provinsi
                  </span>
                  <Select
                    value={data.province_id ?? ''}
                    onValueChange={(val) =>
                      setData({
                        ...data,
                        province_id: val,
                        regency_id: '',
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Semua provinsi" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map((province) => (
                        <SelectItem key={province.id} value={province.id}>
                          {province.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Kabupaten / Kota
                  </span>
                  <Select
                    value={data.regency_id ?? ''}
                    onValueChange={(val) =>
                      setData({ ...data, regency_id: val })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Semua kabupaten/kota" />
                    </SelectTrigger>
                    <SelectContent>
                      {regencies.map((regency) => (
                        <SelectItem key={regency.id} value={regency.id}>
                          {regency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Kategori Pekerjaan
                  </span>
                  <div className="flex items-center gap-2">
                    <Select
                      value={data.category ?? ''}
                      onValueChange={(val) =>
                        setData({ ...data, category: val })
                      }
                    >
                      <SelectTrigger className="w-full min-w-0 flex-1">
                        <SelectValue placeholder="Semua kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {getGigCategoryLabel(category)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {data.category && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => {
                          const next = { ...data, category: '' };
                          setData(next);
                          router.get(
                            index.url({ query: next }),
                            {},
                            { preserveScroll: true, preserveState: true },
                          );
                        }}
                        title="Hapus pilihan kategori"
                      >
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:col-span-2 md:grid-cols-2">
                  <div>
                    <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Tanggal Kerja
                    </span>
                    <div className="flex items-center gap-2">
                      <DatePicker
                        className="min-w-0 flex-1"
                        value={data.date_from ?? ''}
                        onChange={(val) => setData({ ...data, date_from: val })}
                        placeholder="Dari"
                      />
                      <span className="shrink-0 text-xs font-medium text-muted-foreground">
                        –
                      </span>
                      <DatePicker
                        className="min-w-0 flex-1"
                        value={data.date_to ?? ''}
                        onChange={(val) => setData({ ...data, date_to: val })}
                        placeholder="Sampai"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Rentang Biaya
                    </span>
                    <div className="flex items-center gap-2">
                      <InputGroup className="min-w-0 flex-1">
                        <InputGroupAddon align="inline-start">
                          Rp
                        </InputGroupAddon>
                        <InputGroupInput
                          type="text"
                          inputMode="numeric"
                          placeholder="Biaya min."
                          value={
                            data.minimum_fee
                              ? Number(data.minimum_fee).toLocaleString('id-ID')
                              : ''
                          }
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '');
                            setData({ ...data, minimum_fee: raw });
                          }}
                        />
                      </InputGroup>
                      <span className="shrink-0 text-xs font-medium text-muted-foreground">
                        –
                      </span>
                      <InputGroup className="min-w-0 flex-1">
                        <InputGroupAddon align="inline-start">
                          Rp
                        </InputGroupAddon>
                        <InputGroupInput
                          type="text"
                          inputMode="numeric"
                          placeholder="Biaya max."
                          value={
                            data.maximum_fee
                              ? Number(data.maximum_fee).toLocaleString('id-ID')
                              : ''
                          }
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '');
                            setData({ ...data, maximum_fee: raw });
                          }}
                        />
                      </InputGroup>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={resetFilters}
              >
                Reset filter
              </Button>
            </ListToolbar>
          </form>
        </AppPageCard>
        {gigs.data.length > 0 && (
          <div className="flex flex-col gap-4">
            {gigs.data.map((gig) => (
              <GigCard key={gig.id} gig={gig} />
            ))}
          </div>
        )}

        {gigs.data.length === 0 && (
          <AppPageCard className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <SearchX className="size-6" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              Tidak ada gig yang sesuai
            </span>
            <p className="text-xs text-muted-foreground max-w-sm">
              {hasActiveFilters || data.search
                ? 'Coba ubah kata kunci pencarian atau sesuaikan filter lokasi, kategori, dan biaya Anda.'
                : 'Belum ada gig lokal yang tersedia saat ini. Silakan periksa kembali nanti.'}
            </p>
            {(hasActiveFilters || data.search) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={resetFilters}
              >
                Reset semua filter
              </Button>
            )}
          </AppPageCard>
        )}

        <Pagination page={gigs} />
      </div>
    </AppPage>
  );
}
