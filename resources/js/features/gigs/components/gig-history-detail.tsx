import { Link, useForm } from '@inertiajs/react';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  DollarSign,
  FileText,
  MapPin,
  Scale,
  Star,
  User,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';

import { store as storeRating } from '@/actions/App/Http/Controllers/GigRatingController';
import { AppPage, AppPageCard } from '@/components/layout/app-page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/ui/user-avatar';
import { formatDate } from '@/lib/date';
import history from '@/routes/app/history';
import profile from '@/routes/app/profile';
import {
  GigPaymentStatus,
  getGigDisputeFindingLabel,
  getGigDisputeStatusLabel,
  getGigDisputeSubmissionTypeLabel,
  getGigDisputeTypeLabel,
  getGigExitExecutionModeLabel,
  getGigExitStatusLabel,
  getGigExitTypeLabel,
  getGigFinishRequestStatusLabel,
  getGigPaymentStatusLabel,
  getGigPaymentStatusVariant,
  getGigSettlementOutcomeLabel,
  getGigStatusLabel,
  getGigStatusVariant,
} from '@/types/enum';
import type { HistoryShowProps } from '../history-types';
import { GigConversation } from './gig-conversation';

const money = (value: number | null | undefined) =>
  value === null || value === undefined
    ? '-'
    : `Rp${value.toLocaleString('id-ID')}`;

const dateTime = (value: string | null | undefined) =>
  value ? formatDate(value, 'dd MMM yyyy · HH:mm') : '-';

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
    <AppPage title={gig.title} description="Riwayat permanen dan detail transaksi gig.">
      {/* Top Header Card with Back Button */}
      <AppPageCard className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
          <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
            <Link href={history.index.url()}>
              <ArrowLeft className="size-4" />
              <span>Kembali ke Riwayat</span>
            </Link>
          </Button>
          <Badge variant={getGigStatusVariant(gig.status)} className="text-xs">
            {getGigStatusLabel(gig.status)}
          </Badge>
        </div>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {gig.title}
          </h1>
          {gig.description && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {gig.description}
            </p>
          )}
        </div>

        {/* 2x2 Structured Metadata Grid */}
        <div className="grid gap-3 sm:grid-cols-2 pt-1">
          {/* Mitra Kerja Card */}
          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3.5 shadow-xs">
            {counterpart ? (
              <Link href={profile.show(counterpart.id)} className="group flex items-center gap-3 min-w-0 flex-1">
                <UserAvatar user={counterpart} size="sm" className="shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Mitra Kerja
                  </span>
                  <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {counterpart.name}
                  </span>
                  {counterpart.location && (
                    <span className="text-xs text-muted-foreground truncate">
                      {counterpart.location}
                    </span>
                  )}
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <User className="size-5 shrink-0" />
                <span className="text-xs font-medium">Belum ada mitra kerja</span>
              </div>
            )}
          </div>

          {/* Jadwal & Lokasi Card */}
          <div className="flex flex-col gap-1.5 rounded-xl border border-border/60 bg-card p-3.5 shadow-xs text-xs">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <Calendar className="size-4 shrink-0 text-primary" />
              <span>
                {gig.scheduled_at
                  ? formatDate(gig.scheduled_at, 'dd MMMM yyyy · HH:mm')
                  : `${gig.work_date} pukul ${gig.start_time}`}
              </span>
            </div>
            {gig.location_address && (
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="size-4 shrink-0 text-muted-foreground/70 mt-0.5" />
                <span className="line-clamp-2">{gig.location_address}</span>
              </div>
            )}
          </div>

          {/* Biaya Awal Card */}
          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3.5 shadow-xs text-xs">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <DollarSign className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Biaya Awal
              </span>
              <span className="text-sm font-bold text-foreground">
                {money(gig.posted_fee)}
              </span>
            </div>
          </div>

          {/* Status Waktu Selesai Card */}
          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3.5 shadow-xs text-xs">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Selesai Pada
              </span>
              <span className="text-sm font-semibold text-foreground">
                {dateTime(terminalAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Gig Photos Gallery with PhotoView Lightbox */}
        {gig.media.length > 0 && (
          <div className="flex flex-col gap-2 pt-2 border-t border-border/60">
            <span className="text-xs font-semibold text-foreground">Foto Lampiran Gig</span>
            <PhotoProvider>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {gig.media.map((media) => (
                  <PhotoView key={media.id} src={media.url}>
                    <img
                      src={media.url}
                      alt="Lampiran Gig"
                      className="aspect-video w-full cursor-pointer rounded-lg border border-border/60 object-cover transition-opacity hover:opacity-90"
                    />
                  </PhotoView>
                ))}
              </div>
            </PhotoProvider>
          </div>
        )}
      </AppPageCard>

      {/* Gig Chat Section (Untouched) */}
      <GigConversation conversation={conversation} />

      {/* Persetujuan (Agreements) Cards */}
      {agreements.map((agreement, index) => (
        <AppPageCard key={agreement.id} className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">
                {agreements.length > 1 ? `Persetujuan Kerja #${index + 1}` : 'Persetujuan Kerja'}
              </h2>
            </div>
            <Badge variant="outline" className="text-xs">
              Versi {agreement.terms_version}
            </Badge>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 text-xs">
            <div>
              <span className="font-semibold text-muted-foreground">Ruang Lingkup:</span>
              <p className="text-foreground mt-0.5">{agreement.final_scope ?? '-'}</p>
            </div>
            <div>
              <span className="font-semibold text-muted-foreground">Ekspektasi Hasil:</span>
              <p className="text-foreground mt-0.5">{agreement.delivery_expectations ?? '-'}</p>
            </div>
            <div>
              <span className="font-semibold text-muted-foreground">Jadwal:</span>
              <p className="text-foreground mt-0.5">
                {agreement.scheduled_at
                  ? formatDate(agreement.scheduled_at, 'dd MMMM yyyy · HH:mm')
                  : `${agreement.work_date ?? '-'} ${agreement.start_time ?? ''}`}
              </p>
            </div>
            <div>
              <span className="font-semibold text-muted-foreground">Total Final:</span>
              <p className="text-sm font-bold text-foreground mt-0.5">
                {money(agreement.final_total_price)}
              </p>
            </div>
          </div>

          {agreement.closed_at && (
            <p className="text-xs text-muted-foreground border-t border-border/40 pt-2">
              Ditutup {dateTime(agreement.closed_at)} · {agreement.closure_reason ?? '-'}
            </p>
          )}
        </AppPageCard>
      ))}

      {/* Pembayaran Cards */}
      {payments.map((payment, index) => (
        <AppPageCard key={payment.id} className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <h2 className="text-sm font-bold text-foreground">
              {payments.length > 1 ? `Rincian Pembayaran #${index + 1}` : 'Rincian Pembayaran'}
            </h2>
            <Badge variant={getGigPaymentStatusVariant(payment.status)}>
              {getGigPaymentStatusLabel(payment.status)}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-base font-bold text-foreground">
              {money(payment.amount)} {payment.currency}
            </span>
            <span className="text-muted-foreground">
              Dibayar: {dateTime(payment.paid_at)}
            </span>
          </div>
        </AppPageCard>
      ))}

      {/* Permintaan Keluar Cards */}
      {exitRequests.map((exitRequest, index) => (
        <AppPageCard key={exitRequest.id} className="flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <h2 className="text-sm font-bold text-foreground">
              {exitRequests.length > 1 ? `Permintaan Keluar #${index + 1}` : 'Permintaan Keluar'}
            </h2>
            <Badge variant="outline">
              {getGigExitStatusLabel(exitRequest.status)}
            </Badge>
          </div>
          <div className="text-xs flex flex-col gap-1">
            <p className="font-semibold text-foreground">
              {getGigExitTypeLabel(exitRequest.type)}
            </p>
            <p className="text-muted-foreground">{exitRequest.reason}</p>
            {exitRequest.execution_mode && (
              <p className="text-xs text-muted-foreground pt-1">
                Mode: {getGigExitExecutionModeLabel(exitRequest.execution_mode)}
              </p>
            )}
          </div>
        </AppPageCard>
      ))}

      {/* Pengajuan Selesai Cards with PhotoView Gallery */}
      {finishRequests.map((finishRequest, index) => (
        <AppPageCard key={finishRequest.id} className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <h2 className="text-sm font-bold text-foreground">
              {finishRequests.length > 1 ? `Bukti Penyelesaian #${index + 1}` : 'Bukti Penyelesaian'}
            </h2>
            <Badge variant="outline">
              {getGigFinishRequestStatusLabel(finishRequest.status)}
            </Badge>
          </div>

          {finishRequest.completion_note && (
            <p className="text-xs text-foreground">{finishRequest.completion_note}</p>
          )}

          {finishRequest.rejection_reason && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0" />
              <span>Alasan penolakan: {finishRequest.rejection_reason}</span>
            </div>
          )}

          {finishRequest.media.length > 0 && (
            <PhotoProvider>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 pt-1">
                {finishRequest.media.map((media) => (
                  <PhotoView key={media.id} src={media.url}>
                    <img
                      src={media.url}
                      alt="Bukti penyelesaian"
                      className="aspect-video w-full cursor-pointer rounded-lg border border-border/60 object-cover hover:opacity-90"
                    />
                  </PhotoView>
                ))}
              </div>
            </PhotoProvider>
          )}
        </AppPageCard>
      ))}

      {/* Sengketa Card */}
      {dispute && (
        <AppPageCard className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <h2 className="text-sm font-bold text-foreground">Sengketa Gig</h2>
            <Badge variant="destructive">
              {getGigDisputeStatusLabel(dispute.status)}
            </Badge>
          </div>
          <div className="text-xs flex flex-col gap-1">
            <p className="font-semibold text-foreground">
              Jenis: {getGigDisputeTypeLabel(dispute.type)}
            </p>
            {dispute.finding && (
              <p className="text-muted-foreground">
                Temuan: {getGigDisputeFindingLabel(dispute.finding)}
              </p>
            )}
            {dispute.resolution_note && (
              <p className="text-foreground font-medium pt-1">
                Putusan: {dispute.resolution_note}
              </p>
            )}
          </div>

          {dispute.submissions.map((submission) => (
            <article key={submission.id} className="flex flex-col gap-2 border-t border-border/60 pt-3">
              <h3 className="text-xs font-bold text-foreground">
                {getGigDisputeSubmissionTypeLabel(submission.type)}
              </h3>
              <p className="text-xs text-muted-foreground">{submission.statement}</p>
              {submission.media.length > 0 && (
                <PhotoProvider>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {submission.media.map((media) => (
                      <PhotoView key={media.id} src={media.url}>
                        <img
                          src={media.url}
                          alt="Bukti sengketa"
                          className="aspect-video w-full cursor-pointer rounded-lg border border-border/60 object-cover hover:opacity-90"
                        />
                      </PhotoView>
                    ))}
                  </div>
                </PhotoProvider>
              )}
            </article>
          ))}
        </AppPageCard>
      )}

      {/* Penyelesaian Dana Card */}
      {settlement && (
        <AppPageCard className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
            <Scale className="size-4" />
            <h2>Penyelesaian Dana</h2>
          </div>
          <div className="flex flex-col gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 text-xs">
            <span className="font-semibold text-foreground">
              Hasil: {getGigSettlementOutcomeLabel(settlement.outcome)}
            </span>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Pekerja</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {money(settlement.freelancer_payout)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Klien</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {money(settlement.client_refund)}
                </span>
              </div>
            </div>
          </div>
        </AppPageCard>
      )}

      {/* Rating & Ulasan Card */}
      <AppPageCard className="flex flex-col gap-4">
        <h2 className="text-base font-bold text-foreground">Rating & Ulasan Peserta</h2>

        {ratings.length === 0 && (
          <p className="text-xs text-muted-foreground">Belum ada rating yang diberikan.</p>
        )}

        {ratings.map((rating) => (
          <article key={rating.id} className="flex flex-col gap-1 border-t border-border/60 pt-3 first:border-t-0 first:pt-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-foreground">{rating.rater.name}</span>
              <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                <Star className="size-3.5 fill-amber-400 text-amber-500" />
                <span>{rating.score}.0</span>
              </div>
            </div>
            {rating.comment && (
              <p className="text-xs text-foreground/90 whitespace-pre-wrap">{rating.comment}</p>
            )}
            <span className="text-[10px] text-muted-foreground">{dateTime(rating.created_at)}</span>
          </article>
        ))}

        {capabilities.canRate && (
          <form onSubmit={submitRating} className="flex flex-col gap-3 border-t border-border/60 pt-4">
            <span className="text-xs font-semibold text-foreground">Beri Rating Pekerjaan</span>

            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((starValue) => {
                const active = ratingForm.data.score >= starValue;
                return (
                  <button
                    key={starValue}
                    type="button"
                    className="p-1 focus:outline-hidden cursor-pointer"
                    onClick={() => ratingForm.setData('score', starValue)}
                  >
                    <Star
                      className={`size-6 ${
                        active ? 'fill-amber-400 text-amber-500' : 'text-muted-foreground/30'
                      }`}
                    />
                  </button>
                );
              })}
              <span className="ml-2 text-xs font-bold text-foreground">
                {ratingForm.data.score} / 5
              </span>
            </div>

            {ratingForm.errors.score && (
              <p className="text-xs text-destructive">{ratingForm.errors.score}</p>
            )}

            <Textarea
              maxLength={1000}
              placeholder="Tulis ulasan pekerjaan..."
              value={ratingForm.data.comment}
              onChange={(event) => ratingForm.setData('comment', event.target.value)}
              className="text-xs sm:text-sm"
            />
            {ratingForm.errors.comment && (
              <p className="text-xs text-destructive">{ratingForm.errors.comment}</p>
            )}

            <Button type="submit" disabled={ratingForm.processing} className="self-end">
              {ratingForm.processing ? 'Mengirim...' : 'Kirim Ulasan'}
            </Button>
          </form>
        )}
      </AppPageCard>
    </AppPage>
  );
}
