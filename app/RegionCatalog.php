<?php

namespace App;

use Illuminate\Support\Facades\Cache;
use JsonException;

class RegionCatalog
{
    /**
     * @return array<int, array{id: string, name: string}>
     */
    public function provinces(): array
    {
        return $this->data()['provinces'];
    }

    /**
     * @return array<int, array{id: string, province_id: string, name: string}>|null
     */
    public function regencies(string $provinceId): ?array
    {
        if ($this->province($provinceId) === null) {
            return null;
        }

        return $this->data()['regencies'][$provinceId] ?? [];
    }

    /**
     * @return array{id: string, name: string}|null
     */
    public function province(string $provinceId): ?array
    {
        foreach ($this->provinces() as $province) {
            if ($province['id'] === $provinceId) {
                return $province;
            }
        }

        return null;
    }

    /**
     * @return array{id: string, province_id: string, name: string}|null
     */
    public function regency(string $provinceId, string $regencyId): ?array
    {
        foreach ($this->regencies($provinceId) ?? [] as $regency) {
            if ($regency['id'] === $regencyId) {
                return $regency;
            }
        }

        return null;
    }

    /**
     * @return array{provinces: array<int, array{id: string, name: string}>, regencies: array<string, array<int, array{id: string, province_id: string, name: string}>>}
     */
    private function data(): array
    {
        return Cache::rememberForever('indonesia-regions.v1', function (): array {
            try {
                $json = file_get_contents(resource_path('data/indonesia-regions.json'));

                if ($json === false) {
                    throw new \RuntimeException('Indonesian region catalog cannot be read.');
                }

                return json_decode(
                    $json,
                    true,
                    flags: JSON_THROW_ON_ERROR,
                );
            } catch (JsonException $exception) {
                throw new \RuntimeException('Indonesian region catalog is invalid.', previous: $exception);
            }
        });
    }
}
