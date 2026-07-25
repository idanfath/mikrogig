import { router, useForm } from '@inertiajs/react';
import { useEffect } from 'react';

import { counterproof } from '@/actions/App/Http/Controllers/GigDisputeController';
import { AppPage, AppPageCard } from '@/components/layout/app-page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getServerCountdown } from '@/lib/server-time';
import {
  GigDisputeStatus,
  getGigDisputeFindingLabel,
  getGigDisputeStatusLabel,
  getGigDisputeSubmissionTypeLabel,
  getGigDisputeTypeLabel,
} from '@/types/enum';

type Dispute = {
  id: number;
  type: string;
  status: string;
  reporter: { name: string };
  respondent: { name: string };
  counterproof_due_at: string;
  finding: string | null;
  resolution_note: string | null;
  finish_request: {
    id: number;
    completion_note: string;
    rejection_reason: string | null;
    media: Array<{ id: number; url: string }>;
  } | null;
  submissions: Array<{
    id: number;
    type: string;
    statement: string;
    submitted_at: string;
    media: Array<{ id: number; url: string }>;
  }>;
};

export function GigDisputeDetailPage({
  dispute,
  capabilities,
  server_now: serverNow,
}: {
  dispute: Dispute;
  capabilities: {
    canSubmitCounterproof: boolean;
    counterproofExpired: boolean;
  };
  server_now: string;
}) {
  const form = useForm({ statement: '', photos: [] as File[] });

  useEffect(() => {
    const serverOffset = new Date(serverNow).getTime() - Date.now();

    const delay =
      new Date(dispute.counterproof_due_at).getTime() -
      (Date.now() + serverOffset);

    if (delay <= 0) {
      return;
    }

    const timer = window.setTimeout(
      () => router.reload({ only: ['dispute', 'capabilities', 'server_now'] }),
      delay + 50,
    );

    return () => window.clearTimeout(timer);
  }, [dispute.counterproof_due_at, serverNow]);

  return (
    <AppPage
      title="Sengketa Gig"
      description={`${getGigDisputeTypeLabel(dispute.type)} · ${getGigDisputeStatusLabel(dispute.status)}`}
    >
      <AppPageCard>
        <p>Pelapor: {dispute.reporter.name}</p>
        <p>Responden: {dispute.respondent.name}</p>
        <p>
          Batas counterproof:{' '}
          {new Date(dispute.counterproof_due_at).toLocaleString('id-ID')}
        </p>
        {!capabilities.counterproofExpired && (
          <p className="text-sm text-muted-foreground">
            Sisa waktu:{' '}
            {getServerCountdown(dispute.counterproof_due_at, serverNow)}
          </p>
        )}
      </AppPageCard>
      {dispute.finish_request && (
        <AppPageCard>
          <p className="font-medium">
            Bukti penyelesaian #{dispute.finish_request.id}
          </p>
          <p>{dispute.finish_request.completion_note}</p>
          {dispute.finish_request.rejection_reason && (
            <p className="text-sm text-destructive">
              Alasan penolakan: {dispute.finish_request.rejection_reason}
            </p>
          )}
          {dispute.finish_request.media.map((media, index) => (
            <a
              key={media.id}
              href={media.url}
              className="block text-sm text-primary underline"
            >
              Buka bukti penyelesaian {index + 1}
            </a>
          ))}
        </AppPageCard>
      )}
      {dispute.submissions.map((submission) => (
        <AppPageCard key={submission.id}>
          <p>{getGigDisputeSubmissionTypeLabel(submission.type)}</p>
          <p>{submission.statement}</p>
          {submission.media.map((media) => (
            <a
              key={media.id}
              href={media.url}
              className="block text-sm text-primary underline"
            >
              Buka bukti {media.id}
            </a>
          ))}
        </AppPageCard>
      ))}
      {capabilities.canSubmitCounterproof && (
        <AppPageCard>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              form.post(counterproof.url(dispute), { forceFormData: true });
            }}
            className="flex flex-col gap-2"
          >
            <Textarea
              value={form.data.statement}
              onChange={(event) =>
                form.setData('statement', event.target.value)
              }
              placeholder="Counterproof"
            />
            <Input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) =>
                form.setData('photos', Array.from(event.target.files ?? []))
              }
            />
            {form.progress && (
              <p className="text-sm text-muted-foreground">
                Mengunggah {form.progress.percentage}%
              </p>
            )}
            <Button type="submit" disabled={form.processing}>
              Kirim counterproof
            </Button>
          </form>
        </AppPageCard>
      )}
      {capabilities.counterproofExpired &&
        dispute.status === GigDisputeStatus.AwaitingCounterproof && (
          <AppPageCard>Menunggu resolusi otomatis.</AppPageCard>
        )}
      {dispute.resolution_note && (
        <AppPageCard>
          {dispute.finding && (
            <p>Temuan: {getGigDisputeFindingLabel(dispute.finding)}</p>
          )}
          <p>Keputusan: {dispute.resolution_note}</p>
        </AppPageCard>
      )}
    </AppPage>
  );
}
