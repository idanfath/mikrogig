import { router, useForm } from '@inertiajs/react';
import { useEffect } from 'react';

import {
  accept as acceptFinish,
  reject as rejectFinish,
  store as storeFinish,
} from '@/actions/App/Http/Controllers/GigFinishRequestController';
import {
  dispute,
  proceed,
  respond,
  start,
  storeExit,
  withdraw,
} from '@/actions/App/Http/Controllers/GigWorkflowController';
import { AppPage, AppPageCard } from '@/components/layout/app-page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/date';
import { Textarea } from '@/components/ui/textarea';
import { getServerCountdown } from '@/lib/server-time';
import {
  GigDisputeType,
  GigExitDecision,
  GigExitType,
  GigFinishRequestStatus,
  GigStatus,
  getGigExitStatusLabel,
  getGigFinishRequestStatusLabel,
  getGigPaymentStatusLabel,
  getGigSettlementOutcomeLabel,
  getGigStatusLabel,
} from '@/types/enum';
import type { GigConversation as GigConversationData } from '../conversation-types';
import { GigConversation } from './gig-conversation';

type FinishRequest = {
  id: number;
  status: string;
  completion_note: string;
  review_due_at: string;
  accepted_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  media: Array<{ id: number; url: string }>;
};

type GigWorkflowPageProps = {
  gig: { id: number; title: string; status: string };
  payment: { amount: number; status: string };
  agreement: { work_date: string; start_time: string; scheduled_at: string };
  participants: {
    client: { name: string; location: string | null };
    freelancer: { name: string; location: string | null };
  };
  exit_request: {
    id: number;
    status: string;
    type: string;
    reason: string;
    response: string | null;
  } | null;
  finish_request: FinishRequest | null;
  settlement: {
    outcome: string;
    freelancer_payout: number;
    client_refund: number;
  } | null;
  server_now: string;
  capabilities: {
    canStart: boolean;
    canRequestClientCancellation: boolean;
    canRequestFreelancerAbandonment: boolean;
    canRespondToExitRequest: boolean;
    canWithdrawExitRequest: boolean;
    canProceedUnilaterally: boolean;
    canReportNoShow: boolean;
    canReportStartBlocked: boolean;
    canSubmitFinishRequest: boolean;
    canAcceptFinishRequest: boolean;
    canRejectFinishRequest: boolean;
    canReportWorkObstruction: boolean;
    canDisputeFinishRejection: boolean;
    finishReviewExpired: boolean;
  };
  conversation: GigConversationData;
};

export function GigWorkflowPage({
  gig,
  payment,
  agreement,
  participants,
  exit_request: exitRequest,
  finish_request: finishRequest,
  settlement,
  server_now: serverNow,
  capabilities,
  conversation,
}: GigWorkflowPageProps) {
  const startForm = useForm({});
  const exitType = capabilities.canRequestClientCancellation
    ? GigExitType.ClientCancellation
    : GigExitType.FreelancerAbandonment;
  const exitForm = useForm({ type: exitType, reason: '' });
  const disputeForm = useForm({
    type: GigDisputeType.NoShow as string,
    statement: '',
    photos: [] as File[],
  });
  const finishForm = useForm({
    completion_note: '',
    photos: [] as File[],
  });
  const reviewForm = useForm({ reason: '' });
  const responseForm = useForm({ decision: GigExitDecision.Agree });
  const scheduledAt = new Date(agreement.scheduled_at).getTime();
  const reportsOpen = new Date(serverNow).getTime() >= scheduledAt;
  const disputeType = capabilities.canReportNoShow
    ? GigDisputeType.NoShow
    : capabilities.canReportStartBlocked
      ? GigDisputeType.StartBlocked
      : capabilities.canReportWorkObstruction
        ? GigDisputeType.WorkObstruction
        : GigDisputeType.FinishRejected;
  const canOpenDispute =
    capabilities.canReportNoShow ||
    capabilities.canReportStartBlocked ||
    capabilities.canReportWorkObstruction ||
    capabilities.canDisputeFinishRejection;

  useEffect(() => {
    const serverOffset = new Date(serverNow).getTime() - Date.now();
    const thresholds = [scheduledAt];

    if (
      finishRequest?.status === GigFinishRequestStatus.Pending &&
      gig.status === GigStatus.Review
    ) {
      thresholds.push(new Date(finishRequest.review_due_at).getTime());
    }

    const nextThreshold = thresholds
      .map((threshold) => threshold - (Date.now() + serverOffset))
      .filter((delay) => delay > 0)
      .sort((first, second) => first - second)[0];

    if (nextThreshold === undefined) {
      return;
    }

    const timer = window.setTimeout(
      () =>
        router.reload({
          only: [
            'gig',
            'finish_request',
            'settlement',
            'capabilities',
            'server_now',
          ],
        }),
      nextThreshold + 50,
    );

    return () => window.clearTimeout(timer);
  }, [
    finishRequest?.review_due_at,
    finishRequest?.status,
    gig.status,
    scheduledAt,
    serverNow,
  ]);

  return (
    <AppPage
      title={`Workflow: ${gig.title}`}
      description="Tindakan hanya tersedia saat status gig mengizinkannya."
    >
      <AppPageCard>
        <p>Status: {getGigStatusLabel(gig.status)}</p>
        <p>
          Pembayaran: Rp{payment.amount.toLocaleString('id-ID')} ·{' '}
          {getGigPaymentStatusLabel(payment.status)}
        </p>
        <p>
          Jadwal:{' '}
          {agreement.scheduled_at
            ? formatDate(agreement.scheduled_at, 'dd MMMM yyyy · HH:mm')
            : `${agreement.work_date} pukul ${agreement.start_time}`}
        </p>
        <p>
          Klien: {participants.client.name}
          {participants.client.location
            ? ` · ${participants.client.location}`
            : ''}
        </p>
        <p>
          Pekerja: {participants.freelancer.name}
          {participants.freelancer.location
            ? ` · ${participants.freelancer.location}`
            : ''}
        </p>
        {!reportsOpen && gig.status === GigStatus.Locked && (
          <p className="mt-2 text-sm text-muted-foreground">
            Pelaporan tidak hadir atau mulai kerja terhalang tersedia setelah
            jadwal mulai, dalam{' '}
            {getServerCountdown(agreement.scheduled_at, serverNow)}.
          </p>
        )}
      </AppPageCard>

      {capabilities.canStart && (
        <Button
          onClick={() => startForm.post(start.url(gig))}
          disabled={startForm.processing}
        >
          Mulai kerja
        </Button>
      )}

      {(capabilities.canRequestClientCancellation ||
        capabilities.canRequestFreelancerAbandonment) && (
        <AppPageCard>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              exitForm.post(storeExit.url(gig));
            }}
            className="flex flex-col gap-2"
          >
            <Textarea
              value={exitForm.data.reason}
              onChange={(event) =>
                exitForm.setData('reason', event.target.value)
              }
              placeholder="Alasan keluar"
            />
            {exitForm.errors.reason && (
              <p className="text-sm text-destructive">
                {exitForm.errors.reason}
              </p>
            )}
            <Button type="submit" disabled={exitForm.processing}>
              Minta keluar gig
            </Button>
          </form>
        </AppPageCard>
      )}

      {exitRequest && (
        <AppPageCard>
          <p>Permintaan exit: {getGigExitStatusLabel(exitRequest.status)}</p>
          <p className="text-sm text-muted-foreground">{exitRequest.reason}</p>
          {capabilities.canRespondToExitRequest && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                responseForm.patch(respond.url(exitRequest));
              }}
              className="mt-3 flex gap-2"
            >
              <Button type="submit" disabled={responseForm.processing}>
                Setuju
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={responseForm.processing}
                onClick={() => {
                  responseForm.transform(() => ({
                    decision: GigExitDecision.Refuse,
                  }));
                  responseForm.patch(respond.url(exitRequest));
                }}
              >
                Tolak
              </Button>
            </form>
          )}
          {capabilities.canWithdrawExitRequest && (
            <Button
              className="mt-3"
              variant="outline"
              disabled={responseForm.processing}
              onClick={() => responseForm.patch(withdraw.url(exitRequest))}
            >
              Tarik permintaan
            </Button>
          )}
          {capabilities.canProceedUnilaterally && (
            <Button
              className="mt-3"
              disabled={responseForm.processing}
              onClick={() => responseForm.post(proceed.url(exitRequest))}
            >
              Lanjutkan secara sepihak
            </Button>
          )}
        </AppPageCard>
      )}

      {finishRequest && (
        <AppPageCard>
          <p>
            Bukti penyelesaian:{' '}
            {getGigFinishRequestStatusLabel(finishRequest.status)}
          </p>
          <p className="text-sm">{finishRequest.completion_note}</p>
          {finishRequest.rejection_reason && (
            <p className="text-sm text-destructive">
              Alasan penolakan: {finishRequest.rejection_reason}
            </p>
          )}
          <div className="flex flex-col gap-1">
            {finishRequest.media.map((media, index) => (
              <a
                key={media.id}
                href={media.url}
                className="text-sm text-primary underline"
              >
                Buka bukti penyelesaian {index + 1}
              </a>
            ))}
          </div>
          {finishRequest.status === GigFinishRequestStatus.Pending &&
            !capabilities.finishReviewExpired && (
              <p className="mt-2 text-sm text-muted-foreground">
                Batas tinjauan:{' '}
                {new Date(finishRequest.review_due_at).toLocaleString('id-ID')}{' '}
                · {getServerCountdown(finishRequest.review_due_at, serverNow)}
              </p>
            )}
          {capabilities.finishReviewExpired && (
            <p className="mt-2 text-sm text-muted-foreground">
              Menunggu penyelesaian otomatis.
            </p>
          )}
          {gig.status === GigStatus.Review &&
            finishRequest.status === GigFinishRequestStatus.Pending &&
            !capabilities.canAcceptFinishRequest &&
            !capabilities.finishReviewExpired && (
              <p className="mt-2 text-sm text-muted-foreground">
                Menunggu tinjauan klien.
              </p>
            )}
        </AppPageCard>
      )}

      {(capabilities.canAcceptFinishRequest ||
        capabilities.canRejectFinishRequest) &&
        finishRequest && (
          <AppPageCard>
            <div className="flex flex-col gap-3">
              {capabilities.canAcceptFinishRequest && (
                <Button
                  disabled={reviewForm.processing}
                  onClick={() =>
                    reviewForm.patch(acceptFinish.url(finishRequest))
                  }
                >
                  Terima penyelesaian
                </Button>
              )}
              {capabilities.canRejectFinishRequest && (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    reviewForm.patch(rejectFinish.url(finishRequest));
                  }}
                  className="flex flex-col gap-2"
                >
                  <Textarea
                    value={reviewForm.data.reason}
                    onChange={(event) =>
                      reviewForm.setData('reason', event.target.value)
                    }
                    placeholder="Alasan penolakan"
                  />
                  {reviewForm.errors.reason && (
                    <p className="text-sm text-destructive">
                      {reviewForm.errors.reason}
                    </p>
                  )}
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={reviewForm.processing}
                  >
                    Tolak penyelesaian
                  </Button>
                </form>
              )}
            </div>
          </AppPageCard>
        )}

      {capabilities.canSubmitFinishRequest && (
        <AppPageCard>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              finishForm.post(storeFinish.url(gig), {
                forceFormData: true,
                onSuccess: () => finishForm.reset(),
              });
            }}
            className="flex flex-col gap-2"
          >
            <p className="font-medium">Kirim bukti penyelesaian</p>
            <Textarea
              value={finishForm.data.completion_note}
              onChange={(event) =>
                finishForm.setData('completion_note', event.target.value)
              }
              placeholder="Catatan penyelesaian"
            />
            {finishForm.errors.completion_note && (
              <p className="text-sm text-destructive">
                {finishForm.errors.completion_note}
              </p>
            )}
            <Input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) =>
                finishForm.setData(
                  'photos',
                  Array.from(event.target.files ?? []),
                )
              }
            />
            {finishForm.errors.photos && (
              <p className="text-sm text-destructive">
                {finishForm.errors.photos}
              </p>
            )}
            {finishForm.progress && (
              <p className="text-sm text-muted-foreground">
                Mengunggah {finishForm.progress.percentage}%
              </p>
            )}
            <Button type="submit" disabled={finishForm.processing}>
              Kirim untuk ditinjau
            </Button>
          </form>
        </AppPageCard>
      )}

      {canOpenDispute && (
        <AppPageCard>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              disputeForm.transform((data) => ({
                ...data,
                type: disputeType,
              }));
              disputeForm.post(dispute.url(gig), { forceFormData: true });
            }}
            className="flex flex-col gap-2"
          >
            <p className="font-medium">
              {disputeType === GigDisputeType.WorkObstruction
                ? 'Laporkan hambatan penyelesaian'
                : disputeType === GigDisputeType.FinishRejected
                  ? 'Sengketakan penolakan terbaru'
                  : 'Laporkan sengketa'}
            </p>
            <Textarea
              value={disputeForm.data.statement}
              onChange={(event) =>
                disputeForm.setData('statement', event.target.value)
              }
              placeholder="Pernyataan sengketa"
            />
            {disputeForm.errors.statement && (
              <p className="text-sm text-destructive">
                {disputeForm.errors.statement}
              </p>
            )}
            <Input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) =>
                disputeForm.setData(
                  'photos',
                  Array.from(event.target.files ?? []),
                )
              }
            />
            <p className="text-xs text-muted-foreground">
              {disputeType === GigDisputeType.FinishRejected
                ? 'Foto tambahan opsional, maksimal 5.'
                : 'Wajib 1–5 foto.'}
            </p>
            {disputeForm.errors.photos && (
              <p className="text-sm text-destructive">
                {disputeForm.errors.photos}
              </p>
            )}
            {disputeForm.progress && (
              <p className="text-sm text-muted-foreground">
                Mengunggah {disputeForm.progress.percentage}%
              </p>
            )}
            <Button type="submit" disabled={disputeForm.processing}>
              Buka sengketa
            </Button>
          </form>
        </AppPageCard>
      )}

      {settlement && (
        <AppPageCard>
          <p>Settlement: {getGigSettlementOutcomeLabel(settlement.outcome)}</p>
          <p>
            Untuk pekerja: Rp
            {settlement.freelancer_payout.toLocaleString('id-ID')} · Refund
            klien: Rp{settlement.client_refund.toLocaleString('id-ID')}
          </p>
        </AppPageCard>
      )}
      <GigConversation conversation={conversation} />
    </AppPage>
  );
}
