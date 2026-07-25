<?php

namespace App\Http\Controllers;

use App\Models\UserBan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SuspensionController extends Controller
{
    public function show(Request $request): Response|RedirectResponse
    {
        $ban = $request->user()
            ->activeBan()
            ->with([
                'gigOffense.gig.settlement',
                'gigOffense.exitRequest',
                'gigOffense.dispute',
            ])
            ->first();

        if ($ban === null) {
            return redirect()->route('app.home');
        }

        return Inertia::render('app/suspension', [
            'ban' => $this->banData($ban),
            'server_now' => now()->toISOString(),
        ]);
    }

    /** @return array<string, mixed> */
    private function banData(UserBan $ban): array
    {
        $offense = $ban->gigOffense;
        $source = $offense?->dispute ?? $offense?->exitRequest;
        $settlement = $offense?->gig?->settlement;

        return [
            'reason' => $ban->reason,
            'banned_at' => $ban->banned_at->toISOString(),
            'banned_until' => $ban->banned_until?->toISOString(),
            'is_permanent' => $ban->banned_until === null,
            'offense' => $offense === null ? null : [
                'sequence' => $offense->sequence,
                'duration_days' => $offense->duration_days,
                'gig' => [
                    'id' => $offense->gig->id,
                    'title' => $offense->gig->title,
                ],
                'source' => $source === null ? null : [
                    'kind' => $offense->dispute !== null ? 'dispute' : 'exit_request',
                    'type' => $source->type->value,
                    'status' => $source->status->value,
                    'finding' => $offense->dispute?->finding?->value,
                    'execution_mode' => $offense->exitRequest?->execution_mode?->value,
                    'resolution_note' => $offense->dispute?->resolution_note,
                ],
                'resolution' => $settlement === null ? null : [
                    'outcome' => $settlement->outcome->value,
                    'total_amount' => $settlement->total_amount,
                    'freelancer_payout' => $settlement->freelancer_payout,
                    'client_refund' => $settlement->client_refund,
                ],
            ],
        ];
    }
}
