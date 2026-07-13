<?php

use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\MustOnboard;
use App\Http\Middleware\NoBannedUser;
use App\Http\Middleware\NoVerified;
use App\Http\Middleware\RoleCheck;
use App\Http\Middleware\Verified;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Routing\Middleware\ValidateSignature;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        channels: __DIR__.'/../routes/channels.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
        $middleware->alias([
            'role' => RoleCheck::class,
            'no_banned_user' => NoBannedUser::class,
            'unverified' => NoVerified::class,
            'signed' => ValidateSignature::class,
            'verified' => Verified::class,
            'must_onboard' => MustOnboard::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })
    ->create();
