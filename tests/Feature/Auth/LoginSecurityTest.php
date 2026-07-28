<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

test('existing and unknown login emails receive the same failure response', function () {
    User::factory()->create(['email' => 'existing@example.com']);

    $existingResponse = $this->from('/login')->post('/login', [
        'email' => 'existing@example.com',
        'password' => 'wrong-password',
    ]);
    $unknownResponse = $this->from('/login')->post('/login', [
        'email' => 'unknown@example.com',
        'password' => 'wrong-password',
    ]);

    foreach ([$existingResponse, $unknownResponse] as $response) {
        $response
            ->assertRedirect('/login')
            ->assertSessionHas('error', 'Email atau password salah')
            ->assertSessionHasNoErrors();
    }
});

test('existing and unknown forgot-password emails receive the same public response', function () {
    Queue::fake();
    User::factory()->create(['email' => 'existing@example.com']);

    $existingResponse = $this->from('/password/forgot')->post('/password/forgot', [
        'email' => 'existing@example.com',
    ]);
    $unknownResponse = $this->from('/password/forgot')->post('/password/forgot', [
        'email' => 'unknown@example.com',
    ]);

    foreach ([$existingResponse, $unknownResponse] as $response) {
        $response
            ->assertRedirect('/password/forgot')
            ->assertSessionHas('success', 'Link reset password telah dikirim.')
            ->assertSessionHasNoErrors();
    }
});

test('login requests are limited after five attempts per minute', function () {
    $this->withServerVariables(['REMOTE_ADDR' => '198.51.100.1']);

    for ($attempt = 0; $attempt < 5; $attempt++) {
        $this->post('/login', [
            'email' => 'unknown@example.com',
            'password' => 'wrong-password',
        ])->assertRedirect();
    }

    $this->post('/login', [
        'email' => 'unknown@example.com',
        'password' => 'wrong-password',
    ])->assertTooManyRequests();
});
