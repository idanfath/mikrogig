import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { store as storeRating } from '@/actions/App/Http/Controllers/GigRatingController';
import { AppPage, AppPageCard } from '@/components/layout/app-page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  getGigDisputeFindingLabel,
  getGigDisputeStatusLabel,
  getGigDisputeSubmissionTypeLabel,
  getGigDisputeTypeLabel,
  getGigExitExecutionModeLabel,
  getGigExitStatusLabel,
  getGigExitTypeLabel,
  getGigFinishRequestStatusLabel,
  getGigPaymentStatusLabel,
  getGigSettlementOutcomeLabel,
  getGigStatusLabel,
} from '@/types/enum';
import type { HistoryShowProps } from '../history-types';
import { GigConversation } from './gig-conversation';

const money = (value: number | null | undefined) =>
  value === null || value === undefined
    ? '-'
    : `Rp${value.toLocaleString('id-ID')}`;

const dateTime = (value: string | null | undefined) =>
  value
    ? new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value))
    : '-';

export function GigHistoryDetail({
  gig,
  counterpart,
  agreements,
  payments,
  exit_requests: exitRequests,
  finish_requests: finishRequests,
  settlement,
  dispute,
  ratings,
  terminal_at: terminalAt,
  capabilities,
  conversation,
}: HistoryShowProps) {
  const ratingForm = useForm({ score: 5, comment: '' });

  const submitRating = (event: FormEvent) => {
    event.preventDefault();
    ratingForm.post(storeRating.url(gig.id), {
      preserveScroll: true,
      onSuccess: () => ratingForm.reset(),
    });
  };

  return (
    <AppPage title={gig.title} description="Riwayat gig bersifat tetap.">
      <AppPageCard className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Gig</h2>
          <Badge variant="secondary">{getGigStatusLabel(gig.status)}</Badge>
        </div>
        <p>{gig.description}</p>
        <p className="text-sm text-muted-foreground">
          Jadwal {gig.work_date} pukul {gig.start_time} · {gig.location_address}
        </p>
        <p className="text-sm">Biaya awal: {money(gig.posted_fee)}</p>
        <p className="text-sm">Final: {dateTime(terminalAt)}</p>
        {counterpart && (
          <p className="text-sm">
            Counterpart: {counterpart.name}
            {counterpart.location ? ` · ${counterpart.location}` : ''}
          </p>
        )}
        {gig.media.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {gig.media.map((media) => (
              <img
                key={media.id}
                src={media.url}
                alt=""
                className="aspect-video rounded-lg object-cover"
              />
            ))}
          </div>
        )}
      </AppPageCard>

      {agreements.map((agreement) => (
        <AppPageCard key={agreement.id} className="flex flex-col gap-2">
          <h2 className="font-semibold">Persetujuan #{agreement.id}</h2>
          <p className="text-sm">
            Ruang lingkup: {agreement.final_scope ?? '-'}
          </p>
          <p className="text-sm">
            Jadwal: {agreement.work_date ?? '-'} {agreement.start_time ?? ''}
          </p>
          <p className="text-sm">
            Lokasi: {agreement.location_arrangement ?? '-'}
          </p>
          <p className="text-sm">
            Ekspektasi: {agreement.delivery_expectations ?? '-'}
          </p>
          <p className="text-sm">
            Total final: {money(agreement.final_total_price)} · Versi{' '}
            {agreement.terms_version}
          </p>
          {agreement.closed_at && (
            <p className="text-sm text-muted-foreground">
              Ditutup {dateTime(agreement.closed_at)} ·{' '}
              {agreement.closure_reason ?? '-'}
            </p>
          )}
        </AppPageCard>
      ))}

      {payments.map((payment) => (
        <AppPageCard key={payment.id} className="flex flex-col gap-2">
          <h2 className="font-semibold">Pembayaran #{payment.id}</h2>
          <p className="text-sm">
            {money(payment.amount)} {payment.currency} ·{' '}
            {getGigPaymentStatusLabel(payment.status)}
          </p>
          <p className="text-sm text-muted-foreground">
            Dibayar: {dateTime(payment.paid_at)}
          </p>
        </AppPageCard>
      ))}

      {exitRequests.map((exitRequest) => (
        <AppPageCard key={exitRequest.id} className="flex flex-col gap-2">
          <h2 className="font-semibold">Permintaan keluar #{exitRequest.id}</h2>
          <p className="text-sm">
            {getGigExitTypeLabel(exitRequest.type)} ·{' '}
            {getGigExitStatusLabel(exitRequest.status)}
          </p>
          <p className="text-sm">{exitRequest.reason}</p>
          {exitRequest.execution_mode && (
            <p className="text-sm text-muted-foreground">
              {getGigExitExecutionModeLabel(exitRequest.execution_mode)}
            </p>
          )}
        </AppPageCard>
      ))}

      {finishRequests.map((finishRequest) => (
        <AppPageCard key={finishRequest.id} className="flex flex-col gap-3">
          <h2 className="font-semibold">
            Pengajuan selesai #{finishRequest.id}
          </h2>
          <p className="text-sm">
            {getGigFinishRequestStatusLabel(finishRequest.status)}
          </p>
          <p className="text-sm">{finishRequest.completion_note}</p>
          {finishRequest.rejection_reason && (
            <p className="text-sm text-destructive">
              Alasan penolakan: {finishRequest.rejection_reason}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {finishRequest.media.map((media) => (
              <Link key={media.id} href={media.url} target="_blank">
                <img
                  src={media.url}
                  alt="Bukti penyelesaian"
                  className="aspect-video rounded-lg object-cover"
                />
              </Link>
            ))}
          </div>
        </AppPageCard>
      ))}

      {dispute && (
        <AppPageCard className="flex flex-col gap-3">
          <h2 className="font-semibold">Sengketa</h2>
          <p className="text-sm">
            {getGigDisputeTypeLabel(dispute.type)} ·{' '}
            {getGigDisputeStatusLabel(dispute.status)}
          </p>
          {dispute.finding && (
            <p className="text-sm">
              Temuan: {getGigDisputeFindingLabel(dispute.finding)}
            </p>
          )}
          {dispute.resolution_note && (
            <p className="text-sm">Putusan: {dispute.resolution_note}</p>
          )}
          {dispute.submissions.map((submission) => (
            <article
              key={submission.id}
              className="flex flex-col gap-2 border-t pt-3"
            >
              <h3 className="text-sm font-medium">
                {getGigDisputeSubmissionTypeLabel(submission.type)}
              </h3>
              <p className="text-sm">{submission.statement}</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {submission.media.map((media) => (
                  <Link key={media.id} href={media.url} target="_blank">
                    <img
                      src={media.url}
                      alt="Bukti sengketa"
                      className="aspect-video rounded-lg object-cover"
                    />
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </AppPageCard>
      )}

      {settlement && (
        <AppPageCard className="flex flex-col gap-2">
          <h2 className="font-semibold">Penyelesaian dana</h2>
          <p className="text-sm">
            {getGigSettlementOutcomeLabel(settlement.outcome)}
          </p>
          <p className="text-sm">
            Pekerja {money(settlement.freelancer_payout)} · Klien{' '}
            {money(settlement.client_refund)}
          </p>
        </AppPageCard>
      )}

      <AppPageCard className="flex flex-col gap-4">
        <h2 className="font-semibold">Rating peserta</h2>
        {ratings.length === 0 && (
          <p className="text-sm text-muted-foreground">Belum ada rating.</p>
        )}
        {ratings.map((rating) => (
          <article key={rating.id} className="border-t pt-3 first:border-t-0">
            <p className="font-medium">
              {rating.rater.name} · {rating.score}/5
            </p>
            {rating.comment && <p className="text-sm">{rating.comment}</p>}
            <p className="text-xs text-muted-foreground">
              {dateTime(rating.created_at)}
            </p>
          </article>
        ))}

        {capabilities.canRate && (
          <form
            onSubmit={submitRating}
            className="flex flex-col gap-3 border-t pt-4"
          >
            <label className="flex flex-col gap-1 text-sm">
              Nilai
              <select
                value={ratingForm.data.score}
                onChange={(event) =>
                  ratingForm.setData('score', Number(event.target.value))
                }
                className="h-9 rounded-md border bg-background px-2"
              >
                {[5, 4, 3, 2, 1].map((score) => (
                  <option key={score} value={score}>
                    {score} bintang
                  </option>
                ))}
              </select>
            </label>
            {ratingForm.errors.score && (
              <p className="text-sm text-destructive">
                {ratingForm.errors.score}
              </p>
            )}
            <Textarea
              maxLength={1000}
              placeholder="Komentar opsional"
              value={ratingForm.data.comment}
              onChange={(event) =>
                ratingForm.setData('comment', event.target.value)
              }
            />
            {ratingForm.errors.comment && (
              <p className="text-sm text-destructive">
                {ratingForm.errors.comment}
              </p>
            )}
            <Button type="submit" disabled={ratingForm.processing}>
              {ratingForm.processing ? 'Mengirim...' : 'Kirim rating'}
            </Button>
          </form>
        )}
      </AppPageCard>
      <GigConversation conversation={conversation} />
    </AppPage>
  );
}
