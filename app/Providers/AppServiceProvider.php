<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Inertia\ExceptionResponse;
use Inertia\Inertia;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        Inertia::handleExceptionsUsing(function (ExceptionResponse $response) {
            if ($response->statusCode() === 429) {
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
}
