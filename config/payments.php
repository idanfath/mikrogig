<?php

use App\Services\Payments\MockPaymentGateway;

return [
    'default' => env('PAYMENT_DRIVER', 'mock'),
    'window_hours' => 3,

    'drivers' => [
        'mock' => [
            'gateway' => MockPaymentGateway::class,
        ],
    ],
];
