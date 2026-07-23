import type { Region, Regency } from '@/features/regions/types';
import {
  provinces as provincesRoute,
  regencies as regenciesRoute,
} from '@/routes/regions';

let provincesCache: Region[] | null = null;
let provincesPromise: Promise<Region[]> | null = null;
const regenciesCache = new Map<string, Regency[]>();
const regenciesPromises = new Map<string, Promise<Regency[]>>();

export function getCachedProvinces(): Region[] | null {
  return provincesCache;
}

export function getCachedRegencies(provinceId: string): Regency[] | null {
  return regenciesCache.get(provinceId) ?? null;
}

export async function fetchProvinces(): Promise<Region[]> {
  if (provincesCache) {
    return provincesCache;
  }

  if (!provincesPromise) {
    provincesPromise = fetch(provincesRoute.url())
      .then((response) => {
        if (!response.ok) {
          throw new Error('Gagal memuat data provinsi.');
        }

        return response.json() as Promise<Region[]>;
      })
      .then((provinces) => {
        provincesCache = provinces;

        return provinces;
      })
      .finally(() => {
        provincesPromise = null;
      });
  }

  return provincesPromise;
}

export async function fetchRegencies(provinceId: string): Promise<Regency[]> {
  const cached = regenciesCache.get(provinceId);

  if (cached) {
    return cached;
  }

  const inFlight = regenciesPromises.get(provinceId);

  if (inFlight) {
    return inFlight;
  }

  const promise = fetch(regenciesRoute.url(provinceId))
    .then((response) => {
      if (!response.ok) {
        throw new Error('Gagal memuat data kabupaten/kota.');
      }

      return response.json() as Promise<Regency[]>;
    })
    .then((regencies) => {
      regenciesCache.set(provinceId, regencies);

      return regencies;
    })
    .finally(() => {
      regenciesPromises.delete(provinceId);
    });

  regenciesPromises.set(provinceId, promise);

  return promise;
}
