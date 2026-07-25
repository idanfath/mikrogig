<?php

namespace App\Providers;

use App\Services\Payments\PaymentGateway;
use Carbon\CarbonImmutable;
use Illuminate\Console\Events\CommandStarting;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Inertia\ExceptionResponse;
use Inertia\Inertia;
use LogicException;
use RuntimeException;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(PaymentGateway::class, function ($app): PaymentGateway {
            $gateway = config('payments.drivers.'.config('payments.default').'.gateway');

            if (! is_string($gateway) || ! is_a($gateway, PaymentGateway::class, true)) {
                throw new LogicException('Configured payment gateway is invalid.');
            }

            return $app->make($gateway);
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureFreshMigrationStorageCleanup();

        Inertia::handleExceptionsUsing(function (ExceptionResponse $response) {
            if ($response->statusCode() === 429) {
                if ($response->request->routeIs('login.submit')) {
                    return null;
                }

                // useHttp / JSON clients need Laravel's default JSON 429 body
                if ($response->request->expectsJson() || $response->request->wantsJson()) {
                    return null;
                }

                return back()->with('error', 'Too Many Request!');
            }

            if (in_array($response->statusCode(), [403, 404, 500, 503])) {
                return $response->render('errorPage', [
                    'status' => $response->statusCode(),
                ])->withSharedData();
            }
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(
            fn (): ?Password => app()->isProduction()
                ? Password::min(12)
                    ->mixedCase()
                    ->letters()
                    ->numbers()
                    ->symbols()
                    ->uncompromised()
                : null,
        );
    }

    protected function configureFreshMigrationStorageCleanup(): void
    {
        Event::listen(CommandStarting::class, function (CommandStarting $event): void {
            if (! $this->app->isLocal() || $event->command !== 'migrate:fresh') {
                return;
            }

            $disk = Storage::disk('cos');

            foreach (['avatars', 'gigs'] as $directory) {
                foreach ($disk->allFiles($directory) as $file) {
                    if (! $disk->delete($file)) {
                        throw new RuntimeException("Failed to delete COS {$file}.");
                    }
                }
            }
        });
    }
}
