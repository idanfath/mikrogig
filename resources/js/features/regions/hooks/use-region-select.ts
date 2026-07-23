import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  fetchProvinces,
  fetchRegencies,
  getCachedProvinces,
  getCachedRegencies,
} from '@/features/regions/lib/region-catalog';
import type { Region, Regency } from '@/features/regions/types';

type UseRegionSelectOptions = {
  provinceId: string;
  regencyId?: string;
  enabled?: boolean;
};

export function useRegionSelect({
  provinceId,
  regencyId = '',
  enabled = true,
}: UseRegionSelectOptions) {
  const [provinces, setProvinces] = useState<Region[]>(
    () => getCachedProvinces() ?? [],
  );
  const [regencies, setRegencies] = useState<Regency[]>(() =>
    provinceId ? (getCachedRegencies(provinceId) ?? []) : [],
  );
  const [loadingProvinces, setLoadingProvinces] = useState(
    () => enabled && getCachedProvinces() === null,
  );
  const [loadingRegencies, setLoadingRegencies] = useState(false);
  const latestProvinceRef = useRef(provinceId);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const cached = getCachedProvinces();

    if (cached) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProvinces(cached);
      setLoadingProvinces(false);

      return;
    }

    let cancelled = false;
    setLoadingProvinces(true);

    void fetchProvinces()
      .then((data) => {
        if (!cancelled) {
          setProvinces(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('Gagal memuat data provinsi.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingProvinces(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    latestProvinceRef.current = provinceId;

    if (!enabled) {
      return;
    }

    if (!provinceId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRegencies([]);
      setLoadingRegencies(false);

      return;
    }

    const cached = getCachedRegencies(provinceId);

    if (cached) {
      setRegencies(cached);
      setLoadingRegencies(false);

      return;
    }

    let cancelled = false;
    setRegencies([]);
    setLoadingRegencies(true);

    void fetchRegencies(provinceId)
      .then((data) => {
        if (!cancelled && latestProvinceRef.current === provinceId) {
          setRegencies(data);
        }
      })
      .catch(() => {
        if (!cancelled && latestProvinceRef.current === provinceId) {
          toast.error('Gagal memuat data kabupaten/kota.');
        }
      })
      .finally(() => {
        if (!cancelled && latestProvinceRef.current === provinceId) {
          setLoadingRegencies(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, provinceId]);

  const selectedProvinceName = provinces.find(
    (province) => province.id === provinceId,
  )?.name;
  const selectedRegencyName = regencies.find(
    (regency) => regency.id === regencyId,
  )?.name;

  return {
    provinces,
    regencies,
    loadingProvinces,
    loadingRegencies,
    selectedProvinceName,
    selectedRegencyName,
  };
}
