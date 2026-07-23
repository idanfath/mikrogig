import { useHttp } from '@inertiajs/react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { resolve } from '@/routes/locations';

export type ResolvedLocation = {
  province_id: string;
  regency_id: string;
};

export function useDetectLocation() {
  const [detecting, setDetecting] = useState(false);
  const locationHttp = useHttp({ latitude: 0, longitude: 0 });

  const detectLocation = (onResolved: (location: ResolvedLocation) => void) => {
    if (!navigator.geolocation) {
      toast.error('Geolocation tidak didukung oleh browser Anda.');

      return;
    }

    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          locationHttp.transform(() => ({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
          const result = (await locationHttp.post(resolve.url())) as ResolvedLocation;

          onResolved(result);
          toast.success('Lokasi berhasil dideteksi.');
        } catch (error: any) {
          toast.error(error.message || 'Gagal mendeteksi lokasi.');
        } finally {
          setDetecting(false);
        }
      },
      (error) => {
        toast.error(
          error.code === error.PERMISSION_DENIED
            ? 'Izin lokasi ditolak oleh browser. Silakan aktifkan izin lokasi.'
            : 'Gagal mengakses GPS.',
        );
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return { detecting, detectLocation };
}
