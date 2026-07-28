<?php

use Inertia\Testing\AssertableInertia as Assert;

test('landing page is public', function () {
    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('home'));
});
