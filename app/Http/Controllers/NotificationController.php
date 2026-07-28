<?php

namespace App\Http\Controllers;

use App\Enums\NotificationCategory;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $search = $request->query('search');
        $category = NotificationCategory::tryFrom((string) $request->query('category'));

        return Inertia::render('app/notifications', [
            'user' => $user,
            'inbox' => Inertia::scroll(
                fn () => app(NotificationService::class)->inbox($user->id, 10, $search, $category)
            ),
            'filters' => [
                'search' => $search,
                'category' => $category?->value,
            ],
        ]);
    }

    public function markRead(Request $request, int $id)
    {
        app(NotificationService::class)->markRead($request->user()->id, $id);

        return back();
    }

    public function markAllRead(Request $request)
    {
        app(NotificationService::class)->markAllAsRead($request->user()->id);

        return back()->with('success', 'Semua notifikasi ditandai telah dibaca.');
    }

    public function destroy(Request $request, int $id)
    {
        app(NotificationService::class)->delete($request->user()->id, $id);

        return back()->with('success', 'Notifikasi berhasil dihapus.');
    }
}
