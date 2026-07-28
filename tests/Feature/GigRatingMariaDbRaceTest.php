<?php

use App\Enums\GigStatus;
use App\Models\Gig;
use App\Models\GigOffer;
use App\Models\GigRating;
use App\Models\Notification;
use App\Models\NotificationRecipient;
use App\Models\User;
use Symfony\Component\Process\Process;

function requireRatingMariaDbRaceDatabase(): void
{
    if (config('database.default') !== 'mariadb') {
        test()->markTestSkipped('MariaDB rating races only run with DB_CONNECTION=mariadb.');
    }
}

function ratingRaceGig(): array
{
    $client = User::factory()->client()->create(['onboarding_step' => null]);
    $freelancer = User::factory()->freelancer()->create(['onboarding_step' => null]);
    $gig = Gig::factory()->for($client, 'client')->create([
        'status' => GigStatus::Completed,
        'completed_at' => now(),
    ]);
    GigOffer::factory()->for($gig)->for($freelancer, 'freelancer')->accepted()->create();

    return [$client, $freelancer, $gig];
}

/** @param list<string> $workers */
function ratingRaceWorkers(array $workers): void
{
    $releaseAt = microtime(true) + 0.5;
    $processes = [];

    foreach ($workers as $worker) {
        $code = <<<'PHP'
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
PHP;
        $code .= "\nwhile (microtime(true) < {$releaseAt}) { usleep(1000); }\ntry { {$worker} } catch (\\DomainException) {}";
        $process = new Process([PHP_BINARY, '-r', $code], base_path());
        $process->start();
        $processes[] = $process;
    }

    foreach ($processes as $process) {
        $process->wait();
        if (! $process->isSuccessful()) {
            throw new RuntimeException($process->getOutput().$process->getErrorOutput());
        }
    }
}

function cleanupRatingRace(User $client, User $freelancer, Gig $gig): void
{
    $notificationIds = Notification::query()
        ->whereIn('created_by', [$client->id, $freelancer->id])
        ->where('action_url', route('app.history.show', $gig))
        ->pluck('id');

    NotificationRecipient::query()->whereIn('notification_id', $notificationIds)->delete();
    Notification::query()->whereKey($notificationIds)->delete();
    GigRating::query()->where('gig_id', $gig->id)->delete();
    GigOffer::query()->where('gig_id', $gig->id)->delete();
    $gig->forceDelete();
    User::query()->whereKey([$client->id, $freelancer->id])->delete();
}

test('MariaDB serializes duplicate rating submissions', function () {
    requireRatingMariaDbRaceDatabase();
    [$client, $freelancer, $gig] = ratingRaceGig();

    try {
        $worker = "app(\\App\\Actions\\Workflow\\SubmitGigRating::class)->execute(\\App\\Models\\User::query()->findOrFail({$client->id}), \\App\\Models\\Gig::query()->findOrFail({$gig->id}), 5, 'Bagus');";
        ratingRaceWorkers([$worker, $worker]);

        expect(GigRating::query()->where('gig_id', $gig->id)->count())->toBe(1);
    } finally {
        cleanupRatingRace($client, $freelancer, $gig);
    }
});

test('MariaDB allows simultaneous cross ratings without deadlock', function () {
    requireRatingMariaDbRaceDatabase();
    [$client, $freelancer, $gig] = ratingRaceGig();

    try {
        ratingRaceWorkers([
            "app(\\App\\Actions\\Workflow\\SubmitGigRating::class)->execute(\\App\\Models\\User::query()->findOrFail({$client->id}), \\App\\Models\\Gig::query()->findOrFail({$gig->id}), 5, 'Bagus');",
            "app(\\App\\Actions\\Workflow\\SubmitGigRating::class)->execute(\\App\\Models\\User::query()->findOrFail({$freelancer->id}), \\App\\Models\\Gig::query()->findOrFail({$gig->id}), 4, 'Klien jelas');",
        ]);

        expect(GigRating::query()->where('gig_id', $gig->id)->count())->toBe(2);
    } finally {
        cleanupRatingRace($client, $freelancer, $gig);
    }
});
