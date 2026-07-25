import { router, useForm } from '@inertiajs/react';
import { useEffect } from 'react';

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
import { Textarea } from '@/components/ui/textarea';
import { getServerCountdown } from '@/features/gigs/lib/server-time';
import {
  GigDisputeType,
  GigExitDecision,
  GigExitType,
  getGigExitStatusLabel,
  getGigPaymentStatusLabel,
  getGigSettlementOutcomeLabel,
  getGigStatusLabel,
} from '@/types/enum';

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
  };
};

export function GigWorkflowPage({
  gig,
  payment,
  agreement,
  participants,
  exit_request: exitRequest,
  settlement,
  server_now: serverNow,
  capabilities,
}: GigWorkflowPageProps) {
  const startForm = useForm({});
  const exitType = capabilities.canRequestClientCancellation
    ? GigExitType.ClientCancellation
    : GigExitType.FreelancerAbandonment;
  const disputeType = capabilities.canReportNoShow
    ? GigDisputeType.NoShow
    : GigDisputeType.StartBlocked;
  const exitForm = useForm({ type: exitType, reason: '' });
  const disputeForm = useForm({
    type: disputeType,
    statement: '',
    photos: [] as File[],
  });
  const responseForm = useForm({ decision: GigExitDecision.Agree });
  const scheduledAt = new Date(agreement.scheduled_at).getTime();
  const reportsOpen = new Date(serverNow).getTime() >= scheduledAt;

  useEffect(() => {
    const serverOffset = new Date(serverNow).getTime() - Date.now();

    const delay = scheduledAt - (Date.now() + serverOffset);

    if (delay <= 0) {
      return;
    }

    const timer = window.setTimeout(
      () => router.reload({ only: ['capabilities', 'server_now'] }),
      delay + 50,
    );

    return () => window.clearTimeout(timer);
  }, [scheduledAt, serverNow]);

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
          Jadwal: {agreement.work_date} pukul {agreement.start_time}
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
        {!reportsOpen && (
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

      {(capabilities.canReportNoShow || capabilities.canReportStartBlocked) && (
        <AppPageCard>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              disputeForm.post(dispute.url(gig));
            }}
            className="flex flex-col gap-2"
          >
            <Textarea
              value={disputeForm.data.statement}
              onChange={(event) =>
                disputeForm.setData('statement', event.target.value)
              }
              placeholder="Pernyataan sengketa"
            />
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
            <Button type="submit" disabled={disputeForm.processing}>
              Laporkan sengketa
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
    </AppPage>
  );
}
