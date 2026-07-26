import { useEffect, useState } from 'react';
import {
  calculateDistanceMeters,
  formatDistance,
} from '@/features/regions/lib/distance';

export const MAX_GPS_ACCURACY_METERS = 400;

type UseGigDistanceOptions = {
  gigLatitude?: number | string | null;
  gigLongitude?: number | string | null;
  gigAccuracy?: number | null;
  enabled?: boolean;
};

export function useGigDistance({
  gigLatitude,
  gigLongitude,
  gigAccuracy,
  enabled = false,
}: UseGigDistanceOptions) {
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [workerAccuracy, setWorkerAccuracy] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numGigLat =
    typeof gigLatitude === 'string' ? parseFloat(gigLatitude) : gigLatitude;
  const numGigLng =
    typeof gigLongitude === 'string' ? parseFloat(gigLongitude) : gigLongitude;

  const canQuery =
    enabled &&
    numGigLat !== undefined &&
    numGigLat !== null &&
    !isNaN(numGigLat) &&
    numGigLng !== undefined &&
    numGigLng !== null &&
    !isNaN(numGigLng);

  const isGeolocationUnsupported =
    canQuery && (typeof navigator === 'undefined' || !navigator.geolocation);

  useEffect(() => {
    if (!canQuery || isGeolocationUnsupported) {
      return;
    }

    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      setLoading(true);
      setError(null);
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) {
          return;
        }

        const workerLat = position.coords.latitude;
        const workerLng = position.coords.longitude;
        const accuracy = Math.round(position.coords.accuracy);

        setWorkerAccuracy(accuracy);

        const dist = calculateDistanceMeters(
          workerLat,
          workerLng,
          numGigLat,
          numGigLng,
        );

        setDistanceMeters(dist);
        setLoading(false);
      },
      (err) => {
        if (cancelled) {
          return;
        }

        setError(
          err.code === err.PERMISSION_DENIED
            ? 'Izin lokasi tidak diberikan'
            : 'Gagal mendapatkan lokasi GPS',
        );
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );

    return () => {
      cancelled = true;
    };
  }, [canQuery, isGeolocationUnsupported, numGigLat, numGigLng]);

  const effectiveGigAccuracy = gigAccuracy ?? 0;
  const isGigAccurate =
    effectiveGigAccuracy <= 0 ||
    effectiveGigAccuracy <= MAX_GPS_ACCURACY_METERS;
  const isWorkerAccurate =
    workerAccuracy !== null && workerAccuracy <= MAX_GPS_ACCURACY_METERS;
  const isAccurate = isGigAccurate && isWorkerAccurate;

  return {
    distanceMeters,
    distanceFormatted:
      distanceMeters !== null ? formatDistance(distanceMeters) : null,
    workerAccuracy,
    isAccurate,
    loading,
    error: isGeolocationUnsupported
      ? 'Browser tidak mendukung geolokasi'
      : error,
  };
}
