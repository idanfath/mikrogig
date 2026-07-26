<?php

namespace App\Http\Resources;

use App\Enums\GigWorkflowEvent;
use App\Enums\UserRole;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GigMessageResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'kind' => $this->kind->value,
            'body' => $this->body,
            'workflow_event' => $this->workflow_event?->value,
            'event_snapshot' => $this->event_snapshot,
            'event_title' => $this->workflow_event === null ? null : $this->eventTitle($this->workflow_event),
            'event_action' => $this->workflow_event !== null
                && $request->user()?->role !== UserRole::Admin
                    ? [
                        'url' => route('app.gig_conversations.destination', $this->gig_agreement_id),
                        'label' => 'Lihat detail',
                    ]
                    : null,
            'sender' => $this->sender === null ? null : [
                'id' => $this->sender->id,
                'name' => $this->sender->name,
                'avatar_url' => $this->sender->avatar_url,
            ],
            'recipient_id' => $this->recipient_id,
            'read_at' => $this->read_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'media' => $this->media->map(fn ($media): array => [
                'id' => $media->id,
                'mime_type' => $media->mime_type,
                'url' => route('app.gig_message_media.show', $media),
            ])->values(),
        ];
    }

    private function eventTitle(GigWorkflowEvent $event): string
    {
        return match ($event) {
            GigWorkflowEvent::FreelancerSelected => 'Freelancer dipilih',
            GigWorkflowEvent::AgreementTermsSubmitted => 'Syarat persetujuan dikirim',
            GigWorkflowEvent::AgreementChangesRequested => 'Perubahan persetujuan diminta',
            GigWorkflowEvent::AgreementAccepted => 'Persetujuan diterima',
            GigWorkflowEvent::AgreementDeclined => 'Persetujuan ditolak freelancer',
            GigWorkflowEvent::FreelancerLeft => 'Freelancer meninggalkan persiapan',
            GigWorkflowEvent::SelectedFreelancerRejected => 'Freelancer terpilih ditolak',
            GigWorkflowEvent::PaymentPending => 'Pembayaran menunggu',
            GigWorkflowEvent::PaymentConfirmed => 'Pembayaran dikonfirmasi',
            GigWorkflowEvent::PaymentCancelled => 'Pembayaran dibatalkan',
            GigWorkflowEvent::PaymentExpired => 'Pembayaran kedaluwarsa',
            GigWorkflowEvent::WorkStarted => 'Pekerjaan dimulai',
            GigWorkflowEvent::ExitRequested => 'Permintaan keluar dibuat',
            GigWorkflowEvent::ExitAccepted => 'Permintaan keluar disetujui',
            GigWorkflowEvent::ExitRefused => 'Permintaan keluar ditolak',
            GigWorkflowEvent::ExitWithdrawn => 'Permintaan keluar ditarik',
            GigWorkflowEvent::ExitProceeded => 'Keluar sepihak dijalankan',
            GigWorkflowEvent::FinishSubmitted => 'Penyelesaian diajukan',
            GigWorkflowEvent::FinishRejected => 'Penyelesaian ditolak',
            GigWorkflowEvent::GigCompleted => 'Gig selesai',
            GigWorkflowEvent::DisputeOpened => 'Sengketa dibuka',
            GigWorkflowEvent::CounterproofSubmitted => 'Bukti balasan dikirim',
            GigWorkflowEvent::DisputeResolved => 'Sengketa diselesaikan',
            GigWorkflowEvent::GigCancelled => 'Gig dibatalkan',
        };
    }
}
