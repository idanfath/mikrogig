<?php

use App\Enums\GigEstimatedDuration;
use App\Enums\WageBenchmarkStatus;
use App\RegionCatalog;
use App\Services\WageBenchmarkService;

test('wage benchmark calculates every duration with integer-safe thousand rounding', function (
    GigEstimatedDuration $duration,
    int $minimum,
    int $maximum,
) {
    $benchmark = app(WageBenchmarkService::class)->calculate('11', $duration);

    expect($benchmark)->toBe([
        'minimum' => $minimum,
        'maximum' => $maximum,
        'year' => 2026,
    ]);
})->with([
    'under one hour' => [GigEstimatedDuration::UnderOneHour, 32_000, 32_000],
    'one to two hours' => [GigEstimatedDuration::OneToTwoHours, 32_000, 63_000],
    'two to four hours' => [GigEstimatedDuration::TwoToFourHours, 63_000, 125_000],
    'four to six hours' => [GigEstimatedDuration::FourToSixHours, 125_000, 188_000],
    'six to eight hours' => [GigEstimatedDuration::SixToEightHours, 188_000, 250_000],
    'one to two days' => [GigEstimatedDuration::OneToTwoDays, 250_000, 500_000],
    'three to five days' => [GigEstimatedDuration::ThreeToFiveDays, 750_000, 1_249_000],
]);

test('wage benchmark status follows exact boundaries', function () {
    expect(WageBenchmarkStatus::forAmount(99_999, 100_000, 200_000))->toBe(WageBenchmarkStatus::Below)
        ->and(WageBenchmarkStatus::forAmount(100_000, 100_000, 200_000))->toBe(WageBenchmarkStatus::Within)
        ->and(WageBenchmarkStatus::forAmount(199_999, 100_000, 200_000))->toBe(WageBenchmarkStatus::Within)
        ->and(WageBenchmarkStatus::forAmount(200_000, 100_000, 200_000))->toBe(WageBenchmarkStatus::Meets)
        ->and(WageBenchmarkStatus::forAmount(100_000, 100_000, 100_000))->toBe(WageBenchmarkStatus::Meets);
});

test('official wage data covers every selectable province', function () {
    $configuredProvinceIds = array_keys(config('wage-benchmarks.provinces'));
    $selectableProvinceIds = collect(app(RegionCatalog::class)->provinces())->pluck('id')->all();

    expect(config('wage-benchmarks.year'))->toBe(2026)
        ->and(config('wage-benchmarks.source.publisher'))->toBe('Kementerian Ketenagakerjaan')
        ->and($configuredProvinceIds)->toHaveCount(38)
        ->and(array_diff($selectableProvinceIds, $configuredProvinceIds))->toBe([]);
});

test('wage benchmark context exposes precomputed ranges without client-side math', function () {
    $context = app(WageBenchmarkService::class)->context(['11']);

    expect($context['durations'])->toHaveCount(7)
        ->and($context['provinces'])->toHaveKey('11')
        ->and($context['provinces']['11'][GigEstimatedDuration::TwoToFourHours->value])->toBe([
            'minimum' => 63_000,
            'maximum' => 125_000,
        ]);
});
