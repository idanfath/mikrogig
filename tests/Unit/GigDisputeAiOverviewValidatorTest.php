<?php

use App\Services\GigDisputeAiOverviewValidator;

function validAiOverview(): array
{
    return collect([
        'neutral_summary',
        'chronology',
        'reporter_position',
        'respondent_position',
        'consistent_facts',
        'contradictions',
        'uncertain_items',
        'admin_review_focus',
    ])->mapWithKeys(fn (string $section): array => [$section => [[
        'segments' => [
            ['type' => 'text', 'text' => 'Ringkasan bukti netral.'],
            ['type' => 'evidence_ref', 'reference' => 'DIS-01'],
        ],
    ]]])->all();
}

it('accepts the exact structured overview contract', function () {
    $validated = (new GigDisputeAiOverviewValidator)->validate(
        json_encode(validAiOverview(), JSON_THROW_ON_ERROR),
        ['DIS-01'],
    );

    expect($validated['valid'])->toBeTrue()
        ->and($validated['result']['chronology'][0]['segments'][1])
        ->toBe(['type' => 'evidence_ref', 'reference' => 'DIS-01']);
});

it('rejects unknown evidence and recommendation language', function () {
    $overview = validAiOverview();
    $overview['neutral_summary'][0]['segments'][1]['reference'] = 'UNKNOWN-01';
    $overview['chronology'][0]['segments'][0]['text'] = 'Admin harus membayar freelancer.';

    $validated = (new GigDisputeAiOverviewValidator)->validate(
        json_encode($overview, JSON_THROW_ON_ERROR),
        ['DIS-01'],
    );

    expect($validated['valid'])->toBeFalse()
        ->and($validated['errors'])->not->toBeEmpty();
});

it('rejects detached references and items without text segments', function () {
    $overview = validAiOverview();
    $overview['neutral_summary'][0] = [
        'text' => 'Bentuk lama.',
        'evidence_refs' => ['DIS-01'],
    ];
    $overview['chronology'][0]['segments'] = [
        ['type' => 'evidence_ref', 'reference' => 'DIS-01'],
    ];

    $validated = (new GigDisputeAiOverviewValidator)->validate(
        json_encode($overview, JSON_THROW_ON_ERROR),
        ['DIS-01'],
    );

    expect($validated['valid'])->toBeFalse()
        ->and($validated['result'])->toBeNull();
});
