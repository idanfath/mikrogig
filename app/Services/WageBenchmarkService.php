<?php

namespace App\Services;

use App\Enums\GigEstimatedDuration;
use DomainException;

class WageBenchmarkService
{
    /**
     * @return array{minimum: int, maximum: int, year: int}
     */
    public function calculate(string $provinceId, GigEstimatedDuration $duration): array
    {
        $monthlyWage = config("wage-benchmarks.provinces.{$provinceId}");
        $divisor = config('wage-benchmarks.hourly_divisor');
        $year = config('wage-benchmarks.year');

        if (! is_int($monthlyWage) || ! is_int($divisor) || $divisor < 1 || ! is_int($year)) {
            throw new DomainException('Acuan upah belum tersedia untuk provinsi ini.');
        }

        return [
            'minimum' => $this->roundedAmount($monthlyWage, $duration->minimumHours(), $divisor),
            'maximum' => $this->roundedAmount($monthlyWage, $duration->maximumHours(), $divisor),
            'year' => $year,
        ];
    }

    public function hasProvince(string $provinceId): bool
    {
        return is_int(config("wage-benchmarks.provinces.{$provinceId}"));
    }

    /**
     * @param  list<string>|null  $provinceIds
     * @return array{
     *     year: int,
     *     source: array{publisher: string, title: string, url: string},
     *     durations: list<array{value: string, label: string}>,
     *     provinces: array<string, array<string, array{minimum: int, maximum: int}>>
     * }
     */
    public function context(?array $provinceIds = null): array
    {
        $provinceIds ??= array_keys(config('wage-benchmarks.provinces', []));
        $provinces = [];

        foreach ($provinceIds as $provinceId) {
            if (! $this->hasProvince($provinceId)) {
                continue;
            }

            foreach (GigEstimatedDuration::cases() as $duration) {
                $benchmark = $this->calculate($provinceId, $duration);
                $provinces[$provinceId][$duration->value] = [
                    'minimum' => $benchmark['minimum'],
                    'maximum' => $benchmark['maximum'],
                ];
            }
        }

        $source = config('wage-benchmarks.source');

        return [
            'year' => (int) config('wage-benchmarks.year'),
            'source' => [
                'publisher' => (string) ($source['publisher'] ?? ''),
                'title' => (string) ($source['title'] ?? ''),
                'url' => (string) ($source['url'] ?? ''),
            ],
            'durations' => array_map(
                fn (GigEstimatedDuration $duration): array => [
                    'value' => $duration->value,
                    'label' => $duration->label(),
                ],
                GigEstimatedDuration::cases(),
            ),
            'provinces' => $provinces,
        ];
    }

    private function roundedAmount(int $monthlyWage, int $hours, int $divisor): int
    {
        $unit = $divisor * 1_000;

        return intdiv(($monthlyWage * $hours) + $unit - 1, $unit) * 1_000;
    }
}
