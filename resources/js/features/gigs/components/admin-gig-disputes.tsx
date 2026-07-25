import { Link, router, useForm } from '@inertiajs/react';

import {
  index,
  resolve,
  show,
} from '@/actions/App/Http/Controllers/AdminGigDisputeController';
import { AppPage, AppPageCard } from '@/components/layout/app-page';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  GigDisputeFinding,
  GigDisputeStatus,
  GigDisputeType,
  GigSettlementOutcome,
  getGigDisputeStatusLabel,
  getGigDisputeTypeLabel,
  getGigDisputeFindingLabel,
  getGigSettlementOutcomeLabel,
} from '@/types/enum';
import type {
  GigDisputeFinding as GigDisputeFindingValue,
  GigSettlementOutcome as GigSettlementOutcomeValue,
} from '@/types/enum';

type QueueDispute = {
  id: number;
  type: string;
  status: string;
  reporter: { name: string };
  respondent: { name: string };
  counterproof_due_at: string;
};

export function AdminGigDisputeQueue({
  disputes,
  filters,
}: {
  disputes: { data: QueueDispute[] };
  filters: { status: string | null; type: string | null };
}) {
  const applyFilters = (status: string, type: string): void => {
    router.get(
      index.url({
        query: {
          ...(status ? { status } : {}),
          ...(type ? { type } : {}),
        },
      }),
      {},
      { preserveScroll: true, preserveState: true },
    );
  };

  return (
    <AppPage
      title="Antrean Sengketa"
      description="Urut berdasarkan tenggat counterproof lalu waktu pembukaan."
    >
      <AppPageCard>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Status
            <select
              value={filters.status ?? ''}
              onChange={(event) =>
                applyFilters(event.target.value, filters.type ?? '')
              }
            >
              <option value="">Semua yang dapat ditindaklanjuti</option>
              <option value={GigDisputeStatus.AwaitingCounterproof}>
                Menunggu counterproof
              </option>
              <option value={GigDisputeStatus.AwaitingAdmin}>
                Menunggu admin
              </option>
              <option value={GigDisputeStatus.Resolved}>Selesai</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Jenis
            <select
              value={filters.type ?? ''}
              onChange={(event) =>
                applyFilters(filters.status ?? '', event.target.value)
              }
            >
              <option value="">Semua jenis</option>
              <option value={GigDisputeType.NoShow}>Tidak hadir</option>
              <option value={GigDisputeType.StartBlocked}>
                Mulai kerja terhalang
              </option>
            </select>
          </label>
        </div>
      </AppPageCard>
      {disputes.data.map((dispute) => (
        <AppPageCard key={dispute.id}>
          <Link
            href={show(dispute)}
            className="font-medium text-primary underline"
          >
            Sengketa #{dispute.id}
          </Link>
          <p>
            {getGigDisputeTypeLabel(dispute.type)} ·{' '}
            {getGigDisputeStatusLabel(dispute.status)}
          </p>
          <p className="text-sm text-muted-foreground">
            {dispute.reporter.name} / {dispute.respondent.name}
          </p>
        </AppPageCard>
      ))}
    </AppPage>
  );
}

export function AdminGigDisputeDetail({
  dispute,
  settlement,
  capabilities,
}: {
  dispute: QueueDispute & {
    finding: string | null;
    resolution_note: string | null;
    submissions: Array<{
      id: number;
      type: string;
      statement: string;
      media: Array<{ id: number; url: string }>;
    }>;
  };
  settlement: {
    outcome: string;
    freelancer_payout: number;
    client_refund: number;
  } | null;
  capabilities: { canResolveDispute: boolean };
}) {
  const form = useForm<{
    finding: GigDisputeFindingValue;
    inconclusive_outcome: GigSettlementOutcomeValue;
    resolution_note: string;
  }>({
    finding: GigDisputeFinding.FreelancerAtFault,
    inconclusive_outcome: GigSettlementOutcome.FullClientRefund,
    resolution_note: '',
  });

  return (
    <AppPage title={`Sengketa #${dispute.id}`}>
      <AppPageCard>
        <p>
          {getGigDisputeTypeLabel(dispute.type)} ·{' '}
          {getGigDisputeStatusLabel(dispute.status)}
        </p>
        {dispute.submissions.map((submission) => (
          <div key={submission.id} className="mt-3">
            <p>{submission.statement}</p>
            {submission.media.map((media) => (
              <a
                key={media.id}
                className="block text-sm text-primary underline"
                href={media.url}
              >
                Buka bukti {media.id}
              </a>
            ))}
          </div>
        ))}
        {dispute.resolution_note && (
          <div className="mt-3">
            {dispute.finding && (
              <p>Temuan: {getGigDisputeFindingLabel(dispute.finding)}</p>
            )}
            <p>Keputusan: {dispute.resolution_note}</p>
          </div>
        )}
      </AppPageCard>
      {capabilities.canResolveDispute && (
        <AppPageCard>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              form.patch(resolve.url(dispute));
            }}
            className="flex flex-col gap-2"
          >
            <select
              value={form.data.finding}
              onChange={(event) =>
                form.setData(
                  'finding',
                  event.target.value as GigDisputeFindingValue,
                )
              }
            >
              <option value={GigDisputeFinding.FreelancerAtFault}>
                Pekerja bersalah
              </option>
              <option value={GigDisputeFinding.ClientAtFault}>
                Klien bersalah
              </option>
              <option value={GigDisputeFinding.Inconclusive}>
                Tidak meyakinkan
              </option>
            </select>
            {form.data.finding === GigDisputeFinding.Inconclusive && (
              <select
                value={form.data.inconclusive_outcome}
                onChange={(event) =>
                  form.setData(
                    'inconclusive_outcome',
                    event.target.value as GigSettlementOutcomeValue,
                  )
                }
              >
                <option value={GigSettlementOutcome.FullClientRefund}>
                  Refund penuh klien
                </option>
                <option value={GigSettlementOutcome.ThirtySeventy}>
                  30/70
                </option>
                <option value={GigSettlementOutcome.FullFreelancerPayout}>
                  Payout penuh pekerja
                </option>
              </select>
            )}
            <Textarea
              value={form.data.resolution_note}
              onChange={(event) =>
                form.setData('resolution_note', event.target.value)
              }
              placeholder="Alasan keputusan"
            />
            <Button type="submit" disabled={form.processing}>
              Selesaikan sengketa
            </Button>
          </form>
        </AppPageCard>
      )}
      {settlement && (
        <AppPageCard>
          <p>Settlement: {getGigSettlementOutcomeLabel(settlement.outcome)}</p>
          <p>
            Pekerja: Rp{settlement.freelancer_payout.toLocaleString('id-ID')} ·
            Klien: Rp{settlement.client_refund.toLocaleString('id-ID')}
          </p>
        </AppPageCard>
      )}
    </AppPage>
  );
}
