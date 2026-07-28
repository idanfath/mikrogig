<?php

namespace App\Http\Controllers;

use Inertia\Response;

class AppController extends Controller
{
    public function user(): Response
    {
        return inertia('app/user/index');
    }
}
