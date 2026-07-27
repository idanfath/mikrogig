import { useEffect, useState } from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import { show as showDispute } from '@/actions/App/Http/Controllers/GigDisputeController';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  FileCheck,
  FileText,
  Image,
  Info,
  PlayCircle,
  ShieldAlert,
  ShieldCheck,
  User,
  UserCheck,
  XCircle,
} from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ImagePicker } from '@/components/ui/image-picker';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useConfirm } from '@/hooks/use-confirm';
import { formatDate } from '@/lib/date';
import { compressImage } from '@/lib/image_utility';
import { capitalize } from '@/lib/utils';
import { show as showGig } from '@/routes/app/gigs';
import { show as showProfile } from '@/routes/app/profile';
import { CompressionProfiles } from '@/types/client_enum';
import { getServerCountdown } from '@/lib/server-time';
import {
  GigDisputeStatus,
  GigDisputeType,
  GigExitDecision,
  GigExitStatus,
  GigExitType,
  GigFinishRequestStatus,
  GigPaymentStatus,
  GigSettlementOutcome,
  GigStatus,
  getGigDisputeTypeLabel,
  getGigExitStatusLabel,
  getGigFinishRequestStatusLabel,
  getGigPaymentStatusLabel,
  getGigPaymentStatusVariant,
  getGigSettlementOutcomeLabel,
  getGigStatusLabel,
  getGigStatusVariant,
} from '@/types/enum';
import type { GigConversation as GigConversationData } from '../conversation-types';
import { GigConversation } from './gig-conversation';

export type FinishRequestMedia = {
  id: number;
  url: string;
};

export type GigFinishRequestData = {
  id: number;
  status: GigFinishRequestStatus;
  completion_note: string;
  review_due_at: string;
  rejection_reason: string | null;
  media: FinishRequestMedia[];
};

export type GigSettlementData = {
  outcome: GigSettlementOutcome;
  freelancer_payout: number;
  client_refund: number;
};

export type GigWorkflowPageProps = {
  gig: { id: number; title: string; status: GigStatus };
  payment: { amount: number; status: GigPaymentStatus };
  agreement: { work_date: string; start_time: string; scheduled_at: string };
  participants: {
    client: { id: number; name: string; avatar_url: string; location: string | null };
    freelancer: { id: number; name: string; avatar_url: string; location: string | null };
  };
  exit_request: {
    id: number;
    status: GigExitStatus;
    type: GigExitType;
    reason: string;
    response: GigExitDecision | null;
  } | null;
  finish_request?: GigFinishRequestData | null;
  dispute?: { id: number; status: GigDisputeStatus; type: GigDisputeType } | null;
  settlement?: GigSettlementData | null;
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
  dispute: activeDispute,
  settlement,
  server_now: serverNow,
  capabilities,
  conversation,
}: GigWorkflowPageProps) {
  const [confirm, confirmDialog] = useConfirm();
  const startForm = useForm({});
  const exitType = capabilities.canRequestClientCancellation
    ? GigExitType.ClientCancellation
    : GigExitType.FreelancerAbandonment;
  const exitForm = useForm({ type: exitType, reason: '' });
  const [finishPhotos, setFinishPhotos] = useState<File[]>([]);
  const [disputePhotos, setDisputePhotos] = useState<File[]>([]);

  const finishForm = useForm({
    completion_note: '',
  });
  const disputeForm = useForm({
    type: GigDisputeType.NoShow as string,
    statement: '',
  });
  const reviewForm = useForm({ reason: '' });
  const responseForm = useForm({ decision: GigExitDecision.Agree });

  const finishPhotoError = Object.entries(finishForm.errors).find(
    ([key]) => key === 'photos' || key.startsWith('photos.'),
  )?.[1];
  const disputePhotoError = Object.entries(disputeForm.errors).find(
    ([key]) => key === 'photos' || key.startsWith('photos.'),
  )?.[1];
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
      description="Pantau alur pelaksanaan gig, pengiriman bukti hasil kerja, dan penyelesaian transaksi."
    >
      <div className="flex flex-col gap-6">
        <GigConversation conversation={conversation} />
        <AppPageCard className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Briefcase className="size-5 text-primary" />
              <span className="font-bold text-foreground text-sm sm:text-base">
                Status Execution Workflow
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={getGigStatusVariant(gig.status)}
                className="px-3 py-1 font-medium text-xs"
              >
                {getGigStatusLabel(gig.status)}
              </Badge>
              <Button asChild variant="outline" size="sm">
                <Link href={showGig.url(gig)}>
                  <ArrowLeft className="mr-1.5 size-4" />
                  Detail Gig
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-card p-3">
              <Coins className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Escrow Pembayaran
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground text-base">
                    Rp{payment.amount.toLocaleString('id-ID')}
                  </span>
                  <Badge variant={getGigPaymentStatusVariant(payment.status)} className="text-[10px] px-2 py-0.5">
                    {getGigPaymentStatusLabel(payment.status)}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-card p-3">
              <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Jadwal Pekerjaan
                </span>
                <span className="font-medium text-foreground text-sm">
                  {agreement.scheduled_at
                    ? formatDate(agreement.scheduled_at, 'dd MMMM yyyy · HH:mm')
                    : `${agreement.work_date} pukul ${agreement.start_time}`}
                </span>
              </div>
            </div>

            <Link
              href={showProfile({ user: participants.client.id }).url}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-secondary/50 p-3 transition-colors hover:bg-secondary"
            >
              <div className="flex min-w-0 items-center gap-3">
                <UserAvatar
                  user={{
                    name: participants.client.name,
                    avatar_url: participants.client.avatar_url,
                  }}
                  size="sm"
                  className="size-10 shrink-0"
                />
                <div className="flex min-w-0 flex-col">
                  <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    Klien (Pemberi Kerja)
                  </span>
                  <span className="truncate text-xs font-semibold sm:text-sm text-foreground">
                    {participants.client.name}
                  </span>
                  {participants.client.location && (
                    <span className="truncate text-[11px] text-muted-foreground">
                      {capitalize(participants.client.location, true)}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground shrink-0" />
            </Link>

            <Link
              href={showProfile({ user: participants.freelancer.id }).url}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-secondary/50 p-3 transition-colors hover:bg-secondary"
            >
              <div className="flex min-w-0 items-center gap-3">
                <UserAvatar
                  user={{
                    name: participants.freelancer.name,
                    avatar_url: participants.freelancer.avatar_url,
                  }}
                  size="sm"
                  className="size-10 shrink-0"
                />
                <div className="flex min-w-0 flex-col">
                  <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    Pekerja (Freelancer)
                  </span>
                  <span className="truncate text-xs font-semibold sm:text-sm text-foreground">
                    {participants.freelancer.name}
                  </span>
                  {participants.freelancer.location && (
                    <span className="truncate text-[11px] text-muted-foreground">
                      {capitalize(participants.freelancer.location, true)}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground shrink-0" />
            </Link>
          </div>

          {!reportsOpen && gig.status === GigStatus.Locked && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-200">
              <Clock className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                Pelaporan tidak hadir atau mulai kerja terhalang tersedia setelah jadwal mulai, dalam{' '}
                <strong>{getServerCountdown(agreement.scheduled_at, serverNow)}</strong>.
              </span>
            </div>
          )}

          {activeDispute && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-foreground">
              <div className="flex items-start gap-3">
                <ShieldAlert className="size-5 text-destructive shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <h3 className="font-bold text-foreground text-sm sm:text-base">
                    Pekerjaan Ini Sedang Dalam Sengketa
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Sengketa sedang ditinjau. Anda dapat melihat detail pernyataan dan bukti pada halaman sengketa.
                  </p>
                </div>
              </div>
              <Button asChild variant="destructive" size="sm" className="shrink-0 self-start sm:self-auto">
                <Link href={showDispute.url(activeDispute)}>
                  <ShieldAlert className="mr-1.5 size-4" />
                  Lihat Sengketa
                </Link>
              </Button>
            </div>
          )}

          {capabilities.canStart && (
            <div className="pt-2 border-t border-border/40 flex justify-end">
              <Button
                disabled={startForm.processing}
                onClick={() =>
                  confirm({
                    title: 'Mulai pekerjaan gig?',
                    description: 'Status gig akan diubah menjadi Sedang Berjalan.',
                    confirmLabel: 'Ya, mulai sekarang',
                    onConfirm: () => startForm.post(start.url(gig)),
                  })
                }
              >
                <PlayCircle className="mr-1.5 size-4" />
                Mulai kerja
              </Button>
            </div>
          )}
        </AppPageCard>

        {(capabilities.canRequestClientCancellation ||
          capabilities.canRequestFreelancerAbandonment) && (
          <AppPageCard className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-500" />
              <h3 className="font-bold text-foreground text-sm">Minta Keluar dari Gig</h3>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                confirm({
                  title: 'Kirim permintaan keluar gig?',
                  description: 'Pihak lawan akan diminta untuk menyetujui permintaan keluar ini.',
                  confirmLabel: 'Ya, kirim permintaan',
                  destructive: true,
                  onConfirm: () => exitForm.post(storeExit.url(gig)),
                });
              }}
              className="flex flex-col gap-3"
            >
              <Textarea
                value={exitForm.data.reason}
                onChange={(event) =>
                  exitForm.setData('reason', event.target.value)
                }
                placeholder="Tuliskan alasan pengajuan keluar dari gig..."
                rows={3}
              />
              {exitForm.errors.reason && (
                <p className="text-xs text-destructive">
                  {exitForm.errors.reason}
                </p>
              )}
              <div className="flex justify-end">
                <Button type="submit" variant="destructive" disabled={exitForm.processing}>
                  Minta keluar gig
                </Button>
              </div>
            </form>
          </AppPageCard>
        )}

        {exitRequest && (
          <AppPageCard className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/40">
              <div className="flex items-center gap-2">
                <AlertCircle className="size-4 text-amber-500" />
                <h3 className="font-bold text-foreground text-sm">Permintaan Keluar Gig</h3>
              </div>
              <Badge variant="outline" className="text-xs">
                {getGigExitStatusLabel(exitRequest.status)}
              </Badge>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap bg-secondary/30 p-3 rounded-xl border border-border/40">
              "{exitRequest.reason}"
            </p>

            {capabilities.canRespondToExitRequest && (
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-border/40">
                <Button
                  disabled={responseForm.processing}
                  onClick={() =>
                    confirm({
                      title: 'Setujui permintaan keluar?',
                      description: 'Gig akan dibatalkan dan settlement akan diproses.',
                      confirmLabel: 'Ya, setuju',
                      onConfirm: () => {
                        responseForm.transform(() => ({
                          decision: GigExitDecision.Agree,
                        }));
                        responseForm.patch(respond.url(exitRequest));
                      },
                    })
                  }
                >
                  Setuju
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={responseForm.processing}
                  onClick={() =>
                    confirm({
                      title: 'Tolak permintaan keluar?',
                      description: 'Permintaan keluar akan ditolak.',
                      confirmLabel: 'Ya, tolak',
                      destructive: true,
                      onConfirm: () => {
                        responseForm.transform(() => ({
                          decision: GigExitDecision.Refuse,
                        }));
                        responseForm.patch(respond.url(exitRequest));
                      },
                    })
                  }
                >
                  Tolak
                </Button>
              </div>
            )}

            {capabilities.canWithdrawExitRequest && (
              <div className="flex justify-end pt-2 border-t border-border/40">
                <Button
                  variant="outline"
                  disabled={responseForm.processing}
                  onClick={() =>
                    confirm({
                      title: 'Tarik permintaan keluar?',
                      description: 'Permintaan keluar yang diajukan akan ditarik.',
                      confirmLabel: 'Ya, tarik',
                      onConfirm: () => responseForm.patch(withdraw.url(exitRequest)),
                    })
                  }
                >
                  Tarik permintaan
                </Button>
              </div>
            )}

            {capabilities.canProceedUnilaterally && (
              <div className="flex justify-end pt-2 border-t border-border/40">
                <Button
                  disabled={responseForm.processing}
                  onClick={() =>
                    confirm({
                      title: 'Lanjutkan secara sepihak?',
                      description: 'Proses keluar gig akan dilanjutkan sepihak karena batas waktu terlewati.',
                      confirmLabel: 'Ya, lanjutkan',
                      onConfirm: () => responseForm.post(proceed.url(exitRequest)),
                    })
                  }
                >
                  Lanjutkan secara sepihak
                </Button>
              </div>
            )}
          </AppPageCard>
        )}

        {finishRequest && (
          <AppPageCard className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <FileCheck className="size-5 text-primary" />
                <h3 className="font-bold text-foreground text-sm sm:text-base">
                  Bukti Penyelesaian Pekerjaan
                </h3>
              </div>
              <Badge variant="outline" className="px-3 py-1 font-medium text-xs">
                {getGigFinishRequestStatusLabel(finishRequest.status)}
              </Badge>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Catatan Pekerja
              </span>
              <div className="rounded-xl bg-secondary/30 p-3.5 border border-border/40 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                {finishRequest.completion_note}
              </div>
            </div>

            {finishRequest.rejection_reason && (
              <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold">Alasan Penolakan Klien</span>
                  <span>{finishRequest.rejection_reason}</span>
                </div>
              </div>
            )}

            {finishRequest.media.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Foto Bukti Hasil Pekerjaan ({finishRequest.media.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {finishRequest.media.map((media: FinishRequestMedia, index: number) => (
                    <a
                      key={media.id}
                      href={media.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg border border-border/40 bg-card px-3 py-2 text-xs font-medium text-primary hover:bg-secondary transition-colors"
                    >
                      <Image className="size-3.5" />
                      <span>Bukti Foto #{index + 1}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {finishRequest.status === GigFinishRequestStatus.Pending &&
              !capabilities.finishReviewExpired && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
                  <Clock className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>
                    Batas waktu tinjauan klien:{' '}
                    <strong>{formatDate(finishRequest.review_due_at, 'dd MMMM yyyy · HH:mm')}</strong> · Sisa waktu{' '}
                    <strong>{getServerCountdown(finishRequest.review_due_at, serverNow)}</strong>.
                  </span>
                </div>
              )}

            {capabilities.finishReviewExpired && (
              <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 p-3 text-xs text-primary">
                <Info className="size-4 shrink-0" />
                <span>Batas waktu tinjauan berakhir. Menunggu penyelesaian otomatis.</span>
              </div>
            )}

            {gig.status === GigStatus.Review &&
              finishRequest.status === GigFinishRequestStatus.Pending &&
              !capabilities.canAcceptFinishRequest &&
              !capabilities.finishReviewExpired && (
                <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-secondary/30 p-3 text-xs text-muted-foreground">
                  <Clock className="size-4 shrink-0" />
                  <span>Menunggu peninjauan dari klien.</span>
                </div>
              )}
          </AppPageCard>
        )}

        {(capabilities.canAcceptFinishRequest ||
          capabilities.canRejectFinishRequest) &&
          finishRequest && (
            <AppPageCard className="flex flex-col gap-4">
              <h3 className="font-bold text-foreground text-sm">Tinjauan Hasil Pekerjaan</h3>
              <div className="flex flex-col gap-3">
                {capabilities.canAcceptFinishRequest && (
                  <div className="flex justify-end">
                    <Button
                      disabled={reviewForm.processing}
                      onClick={() =>
                        confirm({
                          title: 'Terima hasil penyelesaian?',
                          description: 'Pekerjaan dianggap selesai dan dana escrow akan dicairkan ke pekerja.',
                          confirmLabel: 'Ya, terima & selesaikan',
                          onConfirm: () => reviewForm.patch(acceptFinish.url(finishRequest)),
                        })
                      }
                    >
                      <CheckCircle2 className="mr-1.5 size-4" />
                      Terima penyelesaian
                    </Button>
                  </div>
                )}

                {capabilities.canRejectFinishRequest && (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      confirm({
                        title: 'Tolak hasil penyelesaian?',
                        description: 'Alasan penolakan akan dikirimkan kepada pekerja.',
                        confirmLabel: 'Ya, tolak penyelesaian',
                        destructive: true,
                        onConfirm: () => reviewForm.patch(rejectFinish.url(finishRequest)),
                      });
                    }}
                    className="flex flex-col gap-3 pt-3 border-t border-border/40"
                  >
                    <Textarea
                      value={reviewForm.data.reason}
                      onChange={(event) =>
                        reviewForm.setData('reason', event.target.value)
                      }
                      placeholder="Tuliskan alasan penolakan hasil pekerjaan..."
                      rows={3}
                    />
                    {reviewForm.errors.reason && (
                      <p className="text-xs text-destructive">
                        {reviewForm.errors.reason}
                      </p>
                    )}
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        variant="destructive"
                        disabled={reviewForm.processing}
                      >
                        <XCircle className="mr-1.5 size-4" />
                        Tolak penyelesaian
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </AppPageCard>
          )}

        {capabilities.canSubmitFinishRequest && (
          <AppPageCard className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <FileCheck className="size-5 text-primary" />
              <h3 className="font-bold text-foreground text-sm sm:text-base">
                Kirim Bukti Penyelesaian Pekerjaan
              </h3>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                finishForm.transform((data) => ({
                  ...data,
                  photos: finishPhotos,
                }));
                finishForm.post(storeFinish.url(gig), {
                  forceFormData: true,
                  onSuccess: () => {
                    finishForm.reset();
                    setFinishPhotos([]);
                  },
                });
              }}
              className="flex flex-col gap-3"
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Catatan Penyelesaian
                </label>
                <Textarea
                  value={finishForm.data.completion_note}
                  onChange={(event) =>
                    finishForm.setData('completion_note', event.target.value)
                  }
                  placeholder="Jelaskan secara ringkas pekerjaan yang telah diselesaikan..."
                  rows={4}
                />
                {finishForm.errors.completion_note && (
                  <p className="text-xs text-destructive">
                    {finishForm.errors.completion_note}
                  </p>
                )}
              </div>

              <ImagePicker
                files={finishPhotos}
                onFilesChange={setFinishPhotos}
                label="Foto Bukti Hasil Pekerjaan"
                description="JPEG, PNG, atau WebP. Maksimal 5 foto, masing-masing 5 MB."
                error={finishPhotoError}
                maxFiles={5}
                maxBytes={5 * 1024 * 1024}
                maxDimensions={{ width: 12000, height: 12000 }}
                disabled={finishForm.processing}
                transformFile={(file) =>
                  compressImage(file, CompressionProfiles.GigPhoto)
                }
              />

              {finishForm.progress && (
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-2 transition-all duration-300"
                    style={{ width: `${finishForm.progress.percentage}%` }}
                  />
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={finishForm.processing}>
                  <FileCheck className="mr-1.5 size-4" />
                  Kirim untuk ditinjau
                </Button>
              </div>
            </form>
          </AppPageCard>
        )}

        {canOpenDispute && (
          <AppPageCard className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-5 text-destructive" />
                <h3 className="font-bold text-foreground text-sm sm:text-base">
                  {disputeType === GigDisputeType.WorkObstruction
                    ? 'Laporkan Hambatan Penyelesaian'
                    : disputeType === GigDisputeType.FinishRejected
                      ? 'Sengketakan Penolakan Terbaru'
                      : 'Laporkan Sengketa Pekerjaan'}
                </h3>
              </div>
              {disputeType && (
                <Badge variant="outline" className="text-xs">
                  {getGigDisputeTypeLabel(disputeType)}
                </Badge>
              )}
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                confirm({
                  title: 'Buka sengketa pekerjaan?',
                  description: 'Tim admin akan meninjau pernyataan dan bukti yang diserahkan.',
                  confirmLabel: 'Ya, buka sengketa',
                  destructive: true,
                  onConfirm: () => {
                    disputeForm.transform((data) => ({
                      ...data,
                      type: disputeType,
                      photos: disputePhotos,
                    }));
                    disputeForm.post(dispute.url(gig), { forceFormData: true });
                  },
                });
              }}
              className="flex flex-col gap-3"
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Pernyataan Sengketa
                </label>
                <Textarea
                  value={disputeForm.data.statement}
                  onChange={(event) =>
                    disputeForm.setData('statement', event.target.value)
                  }
                  placeholder="Jelaskan secara detail permasalahan atau hambatan yang dialami..."
                  rows={4}
                />
                {disputeForm.errors.statement && (
                  <p className="text-xs text-destructive">
                    {disputeForm.errors.statement}
                  </p>
                )}
              </div>

              <ImagePicker
                files={disputePhotos}
                onFilesChange={setDisputePhotos}
                label="Foto Lampiran Bukti Sengketa"
                description={
                  disputeType === GigDisputeType.FinishRejected
                    ? 'Foto tambahan opsional, maksimal 5 foto, masing-masing 5 MB.'
                    : 'Wajib 1–5 foto bukti, masing-masing 5 MB.'
                }
                error={disputePhotoError}
                maxFiles={5}
                maxBytes={5 * 1024 * 1024}
                maxDimensions={{ width: 12000, height: 12000 }}
                disabled={disputeForm.processing}
                transformFile={(file) =>
                  compressImage(file, CompressionProfiles.GigPhoto)
                }
              />

              {disputeForm.progress && (
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-destructive h-2 transition-all duration-300"
                    style={{ width: `${disputeForm.progress.percentage}%` }}
                  />
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="destructive" disabled={disputeForm.processing}>
                  <ShieldAlert className="mr-1.5 size-4" />
                  Buka sengketa
                </Button>
              </div>
            </form>
          </AppPageCard>
        )}

        {settlement && (
          <AppPageCard className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-foreground text-sm sm:text-base">
                  Hasil Penyelesaian (Settlement)
                </h3>
              </div>
              <Badge variant="default" className="px-3 py-1 font-medium text-xs">
                {getGigSettlementOutcomeLabel(settlement.outcome)}
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                <Coins className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-200">
                    Pencairan Pekerja
                  </span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-300 text-base">
                    Rp{settlement.freelancer_payout.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-card p-3">
                <Coins className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Refund Klien
                  </span>
                  <span className="font-bold text-foreground text-base">
                    Rp{settlement.client_refund.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          </AppPageCard>
        )}
      </div>
      {confirmDialog}
    </AppPage>
  );
}
