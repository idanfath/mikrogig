import { useEffect, useState } from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileCheck,
  FileText,
  Info,
  Scale,
  ShieldAlert,
  User,
  UserCheck,
} from 'lucide-react';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';

import { counterproof } from '@/actions/App/Http/Controllers/GigDisputeController';
import { AppPage, AppPageCard } from '@/components/layout/app-page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ImagePicker } from '@/components/ui/image-picker';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useConfirm } from '@/hooks/use-confirm';
import { formatDate } from '@/lib/date';
import { capitalize } from '@/lib/utils';
import { show as showProfile } from '@/routes/app/profile';
import { compressImage } from '@/lib/image_utility';
import { getServerCountdown } from '@/lib/server-time';
import { show as showWorkflow } from '@/routes/app/gigs/workflow';
import { CompressionProfiles } from '@/types/client_enum';
import {
  GigDisputeStatus,
  getGigDisputeFindingLabel,
  getGigDisputeStatusLabel,
  getGigDisputeStatusVariant,
  getGigDisputeSubmissionTypeLabel,
  getGigDisputeTypeLabel,
  getUserRoleLabel,
} from '@/types/enum';
import type { GigConversation as GigConversationData } from '../conversation-types';
import { GigConversation } from './gig-conversation';

type DisputeMedia = {
  id: number;
  url: string;
};

type DisputeSubmission = {
  id: number;
  type: string;
  submitted_by?: number;
  statement: string;
  submitted_at: string;
  media: DisputeMedia[];
};

type DisputeFinishRequest = {
  id: number;
  completion_note: string;
  rejection_reason: string | null;
  media: DisputeMedia[];
};

type Dispute = {
  id: number;
  type: string;
  status: string;
  gig_id?: number;
  gig?: { id: number; title: string };
  reporter: { id: number; name: string; role?: string | null; avatar_url?: string; location?: string | null };
  respondent: { id: number; name: string; role?: string | null; avatar_url?: string; location?: string | null };
  counterproof_due_at: string;
  finding: string | null;
  resolution_note: string | null;
  finish_request: DisputeFinishRequest | null;
  submissions: DisputeSubmission[];
};

export function GigDisputeDetailPage({
  dispute,
  capabilities,
  server_now: serverNow,
  conversation,
}: {
  dispute: Dispute;
  capabilities: {
    canSubmitCounterproof: boolean;
    counterproofExpired: boolean;
  };
  server_now: string;
  conversation: GigConversationData;
}) {
  const [confirm, confirmDialog] = useConfirm();
  const [photos, setPhotos] = useState<File[]>([]);
  const form = useForm({ statement: '' });

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

  const photoError = Object.entries(form.errors).find(
    ([key]) => key === 'photos' || key.startsWith('photos.'),
  )?.[1];

  const isExpired = capabilities.counterproofExpired;
  const gigId = dispute.gig_id ?? dispute.gig?.id;

  return (
    <AppPage
      title="Sengketa Gig"
      description="Informasi detail, penyerahan bukti, dan hasil penanganan sengketa pekerjaan."
    >
      <PhotoProvider>
        <AppPageCard className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <ShieldAlert className="size-5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold text-foreground">
                    Sengketa Pekerjaan #{dispute.id}
                  </h2>
                  <Badge variant={getGigDisputeStatusVariant(dispute.status)}>
                    {getGigDisputeStatusLabel(dispute.status)}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  Jenis: <strong>{getGigDisputeTypeLabel(dispute.type)}</strong>
                </span>
              </div>
            </div>

            {gigId && (
              <Button asChild variant="outline" size="sm" className="self-start sm:self-auto">
                <Link href={showWorkflow.url({ gig: gigId })}>
                  <ArrowLeft className="mr-1.5 size-4" />
                  Lihat Workflow
                </Link>
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href={showProfile({ user: dispute.reporter.id }).url}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-secondary/50 p-3 transition-colors hover:bg-secondary"
            >
              <div className="flex min-w-0 items-center gap-3">
                <UserAvatar
                  user={{
                    name: dispute.reporter.name,
                    avatar_url: dispute.reporter.avatar_url,
                  }}
                  size="sm"
                  className="size-10 shrink-0"
                />
                <div className="flex min-w-0 flex-col">
                  <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    Pelapor{dispute.reporter.role ? ` · ${getUserRoleLabel(dispute.reporter.role)}` : ''}
                  </span>
                  <span className="truncate text-xs font-semibold sm:text-sm text-foreground">
                    {dispute.reporter.name}
                  </span>
                  {dispute.reporter.location && (
                    <span className="truncate text-[11px] text-muted-foreground">
                      {capitalize(dispute.reporter.location, true)}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground shrink-0" />
            </Link>

            <Link
              href={showProfile({ user: dispute.respondent.id }).url}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-secondary/50 p-3 transition-colors hover:bg-secondary"
            >
              <div className="flex min-w-0 items-center gap-3">
                <UserAvatar
                  user={{
                    name: dispute.respondent.name,
                    avatar_url: dispute.respondent.avatar_url,
                  }}
                  size="sm"
                  className="size-10 shrink-0"
                />
                <div className="flex min-w-0 flex-col">
                  <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    Responden{dispute.respondent.role ? ` · ${getUserRoleLabel(dispute.respondent.role)}` : ''}
                  </span>
                  <span className="truncate text-xs font-semibold sm:text-sm text-foreground">
                    {dispute.respondent.name}
                  </span>
                  {dispute.respondent.location && (
                    <span className="truncate text-[11px] text-muted-foreground">
                      {capitalize(dispute.respondent.location, true)}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground shrink-0" />
            </Link>

            <div className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-card p-3 sm:col-span-2 lg:col-span-1">
              <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Batas Waktu Counterproof
                </span>
                <span className="font-semibold text-foreground text-xs sm:text-sm">
                  {formatDate(dispute.counterproof_due_at, 'dd MMMM yyyy · HH:mm')}
                </span>
                <span
                  className={`text-xs ${
                    isExpired ? 'text-destructive font-medium' : 'text-muted-foreground'
                  }`}
                >
                  {isExpired
                    ? 'Batas waktu counterproof telah berakhir'
                    : `Sisa waktu: ${getServerCountdown(dispute.counterproof_due_at, serverNow)}`}
                </span>
              </div>
            </div>
          </div>
        </AppPageCard>

        {dispute.finish_request && (
          <AppPageCard className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
              <div className="flex items-center gap-2">
                <FileCheck className="size-4 text-primary" />
                <h3 className="font-bold text-foreground text-sm">
                  Bukti Hasil Pekerjaan Terbaru (#{dispute.finish_request.id})
                </h3>
              </div>
              <Badge variant="outline" className="text-xs font-semibold">
                {dispute.respondent.name}
              </Badge>
            </div>

            <div className="rounded-xl border border-border/40 bg-muted/30 p-3.5 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
              {dispute.finish_request.completion_note}
            </div>

            {dispute.finish_request.rejection_reason && (
              <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                <Info className="size-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Alasan Penolakan Klien:</span>{' '}
                  {dispute.finish_request.rejection_reason}
                </div>
              </div>
            )}

            {dispute.finish_request.media.length > 0 && (
              <div className="flex flex-col gap-2 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Lampiran Foto Bukti Hasil ({dispute.finish_request.media.length})
                </span>
                <div className="flex flex-wrap gap-3">
                  {dispute.finish_request.media.map((media, index) => (
                    <PhotoView key={media.id} src={media.url}>
                      <img
                        src={media.url}
                        alt={`Bukti hasil #${index + 1}`}
                        className="size-20 shrink-0 cursor-pointer rounded-xl border border-border/60 object-cover transition-opacity hover:opacity-90"
                      />
                    </PhotoView>
                  ))}
                </div>
              </div>
            )}
          </AppPageCard>
        )}

        {dispute.submissions.map((submission) => {
          const isReporter = submission.submitted_by
            ? submission.submitted_by === dispute.reporter.id
            : submission.type === 'report';
          const author = isReporter ? dispute.reporter : dispute.respondent;

          return (
            <AppPageCard key={submission.id} className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  <h3 className="font-bold text-foreground text-sm">
                    {getGigDisputeSubmissionTypeLabel(submission.type)}
                  </h3>
                  <Badge variant="outline" className="text-xs font-semibold">
                    {author.name}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDate(submission.submitted_at, 'dd MMM yyyy · HH:mm')}
                </span>
              </div>

            <div className="rounded-xl border border-border/40 bg-muted/30 p-3.5 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
              {submission.statement}
            </div>

            {submission.media.length > 0 && (
              <div className="flex flex-col gap-2 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Foto Lampiran Bukti ({submission.media.length})
                </span>
                <div className="flex flex-wrap gap-3">
                  {submission.media.map((media, index) => (
                    <PhotoView key={media.id} src={media.url}>
                      <img
                        src={media.url}
                        alt={`Bukti #${index + 1}`}
                        className="size-20 shrink-0 cursor-pointer rounded-xl border border-border/60 object-cover transition-opacity hover:opacity-90"
                      />
                    </PhotoView>
                  ))}
                </div>
              </div>
            )}
            </AppPageCard>
          );
        })}

        {capabilities.canSubmitCounterproof && (
          <AppPageCard className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-border/40 pb-2">
              <ShieldAlert className="size-5 text-destructive" />
              <h3 className="font-bold text-foreground text-sm sm:text-base">
                Kirim Counterproof Sengketa
              </h3>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                confirm({
                  title: 'Kirim counterproof sengketa?',
                  description: 'Pernyataan dan bukti foto akan diserahkan kepada tim admin.',
                  confirmLabel: 'Ya, kirim counterproof',
                  onConfirm: () => {
                    form.transform((data) => ({
                      ...data,
                      photos,
                    }));
                    form.post(counterproof.url(dispute), {
                      forceFormData: true,
                      onSuccess: () => {
                        form.reset();
                        setPhotos([]);
                      },
                    });
                  },
                });
              }}
              className="flex flex-col gap-3"
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Pernyataan Counterproof
                </label>
                <Textarea
                  value={form.data.statement}
                  onChange={(event) =>
                    form.setData('statement', event.target.value)
                  }
                  placeholder="Jelaskan secara detail bantahan atau tanggapan Anda mengenai sengketa..."
                  rows={4}
                />
                {form.errors.statement && (
                  <p className="text-xs text-destructive">
                    {form.errors.statement}
                  </p>
                )}
              </div>

              <ImagePicker
                files={photos}
                onFilesChange={setPhotos}
                label="Foto Lampiran Bukti Counterproof"
                description="Wajib mengunggah 1–5 foto bukti counterproof (masing-masing maks 5 MB)."
                error={photoError}
                maxFiles={5}
                maxBytes={5 * 1024 * 1024}
                maxDimensions={{ width: 12000, height: 12000 }}
                disabled={form.processing}
                transformFile={(file) =>
                  compressImage(file, CompressionProfiles.GigPhoto)
                }
              />

              {form.progress && (
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-2 transition-all duration-300"
                    style={{ width: `${form.progress.percentage}%` }}
                  />
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={form.processing}>
                  <ShieldAlert className="mr-1.5 size-4" />
                  Kirim counterproof
                </Button>
              </div>
            </form>
          </AppPageCard>
        )}

        {capabilities.counterproofExpired &&
          dispute.status === GigDisputeStatus.AwaitingCounterproof && (
            <AppPageCard className="flex items-center gap-3 border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-200">
              <Clock className="size-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="flex flex-col gap-0.5 text-xs">
                <span className="font-bold">Batas Waktu Tanggapan Berakhir</span>
                <span>Masa pengiriman counterproof telah habis. Sengketa kini menunggu resolusi dan keputusan dari tim admin.</span>
              </div>
            </AppPageCard>
          )}

        {dispute.resolution_note && (
          <AppPageCard className="flex flex-col gap-3 border-emerald-500/30 bg-emerald-500/5">
            <div className="flex items-center gap-2 border-b border-emerald-500/20 pb-2">
              <Scale className="size-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-foreground text-sm sm:text-base">
                Hasil Keputusan Sengketa
              </h3>
            </div>

            {dispute.finding && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Temuan:</span>
                <Badge variant="outline">
                  {getGigDisputeFindingLabel(dispute.finding)}
                </Badge>
              </div>
            )}

            <div className="rounded-xl border border-emerald-500/20 bg-background/60 p-3.5 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
              <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                <CheckCircle2 className="size-4" /> Catatan Keputusan Admin:
              </div>
              {dispute.resolution_note}
            </div>
          </AppPageCard>
        )}
      </PhotoProvider>

      {confirmDialog}
      <GigConversation conversation={conversation} />
    </AppPage>
  );
}
