<?php

namespace App\Http\Controllers;

use App\RegionCatalog;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Throwable;

class LocationController extends Controller
{
    public function __construct(private RegionCatalog $regions) {}

    public function resolve(Request $request): JsonResponse
    {
        $coordinates = $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
        ]);

        try {
            $address = Cache::remember(
                'location.reverse.'.md5(sprintf('%.3F,%.3F', $coordinates['latitude'], $coordinates['longitude'])),
                now()->addDay(),
                fn (): array => Http::acceptJson()
                    ->withHeaders(['User-Agent' => config('app.name').'/1.0'])
                    ->connectTimeout(3)
                    ->timeout(5)
                    ->retry([100, 250])
                    ->get('https://nominatim.openstreetmap.org/reverse', [
                        'lat' => $coordinates['latitude'],
                        'lon' => $coordinates['longitude'],
                        'format' => 'json',
                        'accept-language' => 'id',
                    ])
                    ->throw()
                    ->json('address', []),
            );
        } catch (ConnectionException $exception) {
            return response()->json(['message' => 'Layanan lokasi tidak dapat dihubungi.'], 503);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json(['message' => 'Layanan lokasi tidak tersedia.'], 503);
        }

        $province = $this->matchProvince($address);

        if ($province === null) {
            return response()->json(['message' => 'Provinsi tidak terdeteksi.'], 422);
        }

        $regency = $this->matchRegency($province['id'], $address);

        if ($regency === null) {
            return response()->json(['message' => 'Kabupaten atau kota tidak terdeteksi.'], 422);
        }

        return response()->json([
            'province_id' => $province['id'],
            'regency_id' => $regency['id'],
        ]);
    }

    /**
     * @param  array<string, mixed>  $address
     * @return array{id: string, name: string}|null
     */
    private function matchProvince(array $address): ?array
    {
        $name = $this->normalize((string) ($address['state'] ?? $address['province'] ?? ''));

        foreach ($this->regions->provinces() as $province) {
            if ($this->matches($this->normalize($province['name']), $name)) {
                return $province;
            }
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $address
     * @return array{id: string, province_id: string, name: string}|null
     */
    private function matchRegency(string $provinceId, array $address): ?array
    {
        $name = $this->normalize((string) (
            $address['city']
            ?? $address['regency']
            ?? $address['municipality']
            ?? $address['county']
            ?? $address['town']
            ?? ''
        ));

        foreach ($this->regions->regencies($provinceId) ?? [] as $regency) {
            if ($this->matches($this->normalize($regency['name']), $name)) {
                return $regency;
            }
        }

        return null;
    }

    private function normalize(string $name): string
    {
        return trim((string) preg_replace(
            '/daerah khusus ibukota|provinsi|propinsi|kabupaten|kota/ui',
            '',
            mb_strtolower($name),
        ));
    }

    private function matches(string $catalogName, string $locationName): bool
    {
        return $catalogName !== ''
            && $locationName !== ''
            && (str_contains($catalogName, $locationName) || str_contains($locationName, $catalogName));
    }
}
