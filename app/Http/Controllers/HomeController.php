<?php

namespace App\Http\Controllers;

use App\Services\GigConversationService;
use App\Services\HomeService;
use Illuminate\Http\Request;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(
        Request $request,
        HomeService $home,
        GigConversationService $conversations,
    ): Response {
        return inertia('app/home', [
            'home' => fn (): array => $home->for($request->user()),
            'chat_notices' => fn (): array => $conversations->unreadNotices($request->user()),
        ]);
    }
}
