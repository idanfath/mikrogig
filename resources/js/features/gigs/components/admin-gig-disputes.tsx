import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileCheck,
  FileText,
  Filter,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  User,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';

import {
  index,
  resolve,
  show,
} from '@/actions/App/Http/Controllers/AdminGigDisputeController';
import { AppPage, AppPageCard } from '@/components/layout/app-page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ListToolbar } from '@/components/ui/list-toolbar';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useConfirm } from '@/hooks/use-confirm';
import { formatDate } from '@/lib/date';
import { capitalize } from '@/lib/utils';
import { show as showProfile } from '@/routes/app/profile';
import { getServerCountdown } from '@/lib/server-time';
import {
  GigDisputeFinding,
  GigDisputeStatus,
  GigDisputeType,
  GigSettlementOutcome,
  getGigDisputeFindingLabel,
  getGigDisputeStatusLabel,
  getGigDisputeStatusVariant,
  getGigDisputeSubmissionTypeLabel,
  getGigDisputeTypeLabel,
  getGigSettlementOutcomeLabel,
  getUserRoleLabel,
} from '@/types/enum';
import type {
  GigDisputeFinding as GigDisputeFindingValue,
  GigSettlementOutcome as GigSettlementOutcomeValue,
} from '@/types/enum';
import type { GigConversation as GigConversationData } from '../conversation-types';
import { GigConversation } from './gig-conversation';

type QueueDispute = {
  id: number;
  type: string;
  status: string;
  reporter: { id: number; name: string; role?: string | null; avatar_url?: string; location?: string | null };
  respondent: { id: number; name: string; role?: string | null; avatar_url?: string; location?: string | null };
  counterproof_due_at: string;
  gig?: { id: number; title: string };
};

export function AdminGigDisputeQueue({
  disputes,
  filters,
}: {
  disputes: { data: QueueDispute[] };
  filters: { status: string | null; type: string | null };
}) {
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(
    Boolean(filters.status || filters.type),
  );

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

  const filteredDisputes = disputes.data.filter((dispute) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      dispute.id.toString().includes(q) ||
      dispute.reporter.name.toLowerCase().includes(q) ||
      dispute.respondent.name.toLowerCase().includes(q) ||
      (dispute.gig?.title && dispute.gig.title.toLowerCase().includes(q)) ||
      getGigDisputeTypeLabel(dispute.type).toLowerCase().includes(q)
    );
  });

  const hasActiveFilters = Boolean(filters.status || filters.type || search);

  return (
    <AppPage
      title="Antrean Sengketa Admin"
      description="Tinjau dan selesaikan sengketa gig yang memerlukan tindakan admin."
    >
      <div className="flex flex-col gap-6">
        <AppPageCard>
          <ListToolbar
            search={search}
            onSearchChange={setSearch}
            placeholder="Cari sengketa, ID, atau nama pengguna..."
            filterLabel="Filter sengketa"
            hasActiveFilters={hasActiveFilters}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-foreground">Status Sengketa</span>
                <Select
                  value={filters.status ?? 'all'}
                  onValueChange={(val) =>
                    applyFilters(val === 'all' ? '' : val, filters.type ?? '')
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Semua yang dapat ditindaklanjuti" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua yang dapat ditindaklanjuti</SelectItem>
                    <SelectItem value={GigDisputeStatus.AwaitingCounterproof}>
                      Menunggu Counterproof
                    </SelectItem>
                    <SelectItem value={GigDisputeStatus.AwaitingAdmin}>
                      Menunggu Admin
                    </SelectItem>
                    <SelectItem value={GigDisputeStatus.Resolved}>Selesai</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-foreground">Jenis Sengketa</span>
                <Select
                  value={filters.type ?? 'all'}
                  onValueChange={(val) =>
                    applyFilters(filters.status ?? '', val === 'all' ? '' : val)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Semua Jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Jenis</SelectItem>
                    <SelectItem value={GigDisputeType.NoShow}>Pekerja Tidak Hadir</SelectItem>
                    <SelectItem value={GigDisputeType.StartBlocked}>
                      Mulai Kerja Terhalang
                    </SelectItem>
                    <SelectItem value={GigDisputeType.WorkObstruction}>
                      Penyelesaian Dihalangi
                    </SelectItem>
                    <SelectItem value={GigDisputeType.FinishRejected}>
                      Penyelesaian Ditolak
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {hasActiveFilters && (
                <div className="sm:col-span-2 flex justify-end pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearch('');
                      applyFilters('', '');
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Reset Filter
                  </Button>
                </div>
              )}
            </div>
          </ListToolbar>
        </AppPageCard>

        {filteredDisputes.length === 0 ? (
          <AppPageCard className="flex flex-col items-center justify-center py-12 text-center">
            <ShieldAlert className="size-12 text-muted-foreground/50 mb-3" />
            <h3 className="font-bold text-foreground text-base mb-1">
              Tidak Ada Sengketa
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              {hasActiveFilters
                ? 'Tidak ada sengketa yang sesuai dengan kata kunci atau filter yang Anda pilih.'
                : 'Saat ini belum ada sengketa yang memerlukan penanganan admin.'}
            </p>
          </AppPageCard>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredDisputes.map((dispute) => (
              <AppPageCard key={dispute.id} className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/40">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-foreground text-sm sm:text-base">
                      {getGigDisputeTypeLabel(dispute.type)}
                    </span>
                    <Badge
                      variant={getGigDisputeStatusVariant(dispute.status)}
                      className="px-2.5 py-0.5 font-medium text-xs"
                    >
                      {getGigDisputeStatusLabel(dispute.status)}
                    </Badge>
                  </div>

                  <Button asChild variant="outline" size="sm">
                    <Link href={show(dispute)}>
                      Buka Detail
                      <ChevronRight className="ml-1.5 size-4" />
                    </Link>
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
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

                  <div className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-card p-3">
                    <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Batas Counterproof
                      </span>
                      <span className="font-semibold text-foreground text-xs sm:text-sm">
                        {formatDate(dispute.counterproof_due_at, 'dd MMM yyyy · HH:mm')}
                      </span>
                    </div>
                  </div>
                </div>
              </AppPageCard>
            ))}
          </div>
        )}
      </div>
    </AppPage>
  );
}

export function AdminGigDisputeDetail({
  dispute,
  settlement,
  capabilities,
  conversation,
}: {
  dispute: QueueDispute & {
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
      submitted_by?: number;
      statement: string;
      submitted_at?: string;
      media: Array<{ id: number; url: string }>;
    }>;
  };
  settlement: {
    outcome: string;
    freelancer_payout: number;
    client_refund: number;
  } | null;
  capabilities: { canResolveDispute: boolean };
  conversation: GigConversationData;
}) {
  const [confirm, confirmDialog] = useConfirm();
  const form = useForm<{
    finding: GigDisputeFindingValue;
    inconclusive_outcome: GigSettlementOutcomeValue;
    resolution_note: string;
  }>({
    finding: GigDisputeFinding.FreelancerAtFault,
    inconclusive_outcome: GigSettlementOutcome.FullClientRefund,
    resolution_note: '',
  });

  const handleResolveSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.data.resolution_note.trim()) {
      form.setError('resolution_note', 'Alasan keputusan sengketa wajib diisi.');
      return;
    }

    confirm({
      title: 'Selesaikan Sengketa?',
      description:
        'Keputusan sengketa bersifat final dan akan segera mengesahkan pembagian dana escrow kepada pihak yang berhak.',
      confirmLabel: 'Ya, Selesaikan Sengketa',
      destructive: true,
      onConfirm: () => form.patch(resolve.url(dispute)),
    });
  };

  return (
    <AppPage
      title="Detail Sengketa Pekerjaan"
      description="Tinjau bukti dari pelapor dan responden sebelum memberikan keputusan sengketa."
    >
      <div className="flex flex-col gap-6">
        <AppPageCard className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/40">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-foreground text-sm sm:text-base">
                {getGigDisputeTypeLabel(dispute.type)}
              </span>
              <Badge
                variant={getGigDisputeStatusVariant(dispute.status)}
                className="px-3 py-1 font-medium text-xs"
              >
                {getGigDisputeStatusLabel(dispute.status)}
              </Badge>
            </div>

            <Button asChild variant="outline" size="sm">
              <Link href={index.url()}>
                <ArrowLeft className="mr-1.5 size-4" />
                Kembali ke Antrean
              </Link>
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
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

            <div className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-card p-3">
              <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Batas Counterproof
                </span>
                <span className="font-semibold text-foreground text-xs sm:text-sm">
                  {formatDate(dispute.counterproof_due_at, 'dd MMMM yyyy · HH:mm')}
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
                  Bukti Pengiriman Hasil Pekerjaan
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
              <div className="flex flex-col gap-1 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive">
                <span className="font-bold">Alasan Penolakan Hasil oleh Klien:</span>
                <p className="whitespace-pre-wrap leading-relaxed">
                  {dispute.finish_request.rejection_reason}
                </p>
              </div>
            )}

            {dispute.finish_request.media.length > 0 && (
              <div className="flex flex-col gap-2 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Lampiran Foto Bukti Hasil ({dispute.finish_request.media.length})
                </span>
                <PhotoProvider>
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
                </PhotoProvider>
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
                {submission.submitted_at && (
                  <span className="text-xs text-muted-foreground">
                    {formatDate(submission.submitted_at, 'dd MMM yyyy · HH:mm')}
                  </span>
                )}
              </div>

            <div className="rounded-xl border border-border/40 bg-muted/30 p-3.5 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
              {submission.statement}
            </div>

            {submission.media.length > 0 && (
              <div className="flex flex-col gap-2 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Foto Lampiran Bukti ({submission.media.length})
                </span>
                <PhotoProvider>
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
                </PhotoProvider>
              </div>
            )}
            </AppPageCard>
          );
        })}

        <GigConversation conversation={conversation} />

        {dispute.resolution_note && (
          <AppPageCard className="flex flex-col gap-3 border-emerald-500/30 bg-emerald-500/5">
            <div className="flex items-center gap-2 border-b border-emerald-500/20 pb-2 text-emerald-900 dark:text-emerald-200">
              <Scale className="size-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-base">Hasil Keputusan Admin</h3>
            </div>

            {dispute.finding && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">Temuan Sengketa:</span>
                <Badge variant="outline" className="font-semibold text-xs border-emerald-500/30">
                  {getGigDisputeFindingLabel(dispute.finding)}
                </Badge>
              </div>
            )}

            <div className="rounded-xl border border-emerald-500/20 bg-background/60 p-3.5 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
              {dispute.resolution_note}
            </div>
          </AppPageCard>
        )}

        {capabilities.canResolveDispute && (
          <AppPageCard className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-border/40 pb-2">
              <Scale className="size-5 text-primary" />
              <h3 className="font-bold text-foreground text-base">
                Form Keputusan Sengketa Admin
              </h3>
            </div>

            <form onSubmit={handleResolveSubmit} className="flex flex-col gap-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="finding">Temuan Pihak Bersalah</FieldLabel>
                  <Select
                    value={form.data.finding}
                    onValueChange={(val) =>
                      form.setData('finding', val as GigDisputeFindingValue)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih Pihak Bersalah" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={GigDisputeFinding.FreelancerAtFault}>
                        Pekerja Bersalah
                      </SelectItem>
                      <SelectItem value={GigDisputeFinding.ClientAtFault}>
                        Klien Bersalah
                      </SelectItem>
                      <SelectItem value={GigDisputeFinding.Inconclusive}>
                        Tidak Meyakinkan / Bukti Imbang
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                {form.data.finding === GigDisputeFinding.Inconclusive && (
                  <Field>
                    <FieldLabel htmlFor="inconclusive_outcome">
                      Pembagian Hasil Settlement (Inconclusive)
                    </FieldLabel>
                    <Select
                      value={form.data.inconclusive_outcome}
                      onValueChange={(val) =>
                        form.setData(
                          'inconclusive_outcome',
                          val as GigSettlementOutcomeValue,
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih Pembagian Hasil Settlement" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={GigSettlementOutcome.FullClientRefund}>
                          Refund Penuh Klien (100% Klien)
                        </SelectItem>
                        <SelectItem value={GigSettlementOutcome.ThirtySeventy}>
                          Pembagian 30% Pekerja / 70% Klien
                        </SelectItem>
                        <SelectItem value={GigSettlementOutcome.FullFreelancerPayout}>
                          Payout Penuh Pekerja (100% Pekerja)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                )}

                <Field>
                  <FieldLabel htmlFor="resolution_note">
                    Alasan & Catatan Keputusan Sengketa
                  </FieldLabel>
                  <Textarea
                    id="resolution_note"
                    value={form.data.resolution_note}
                    onChange={(event) =>
                      form.setData('resolution_note', event.target.value)
                    }
                    placeholder="Tuliskan penjelasan dan alasan landasan hukum/aturan yang melandasi keputusan admin..."
                    rows={4}
                  />
                  {form.errors.resolution_note && (
                    <span className="text-xs text-destructive font-medium">
                      {form.errors.resolution_note}
                    </span>
                  )}
                </Field>
              </FieldGroup>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={form.processing}
                  className="gap-2"
                >
                  <CheckCircle2 className="size-4" />
                  Selesaikan Sengketa
                </Button>
              </div>
            </form>
          </AppPageCard>
        )}

        {settlement && (
          <AppPageCard className="flex flex-col gap-3 border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2 border-b border-primary/20 pb-2 text-primary">
              <ShieldCheck className="size-5" />
              <h3 className="font-bold text-base">Settlement Dana Escrow</h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1 rounded-xl border border-border/40 bg-background/60 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Keputusan Outcome
                </span>
                <span className="font-bold text-foreground text-sm">
                  {getGigSettlementOutcomeLabel(settlement.outcome)}
                </span>
              </div>

              <div className="flex flex-col gap-1 rounded-xl border border-border/40 bg-background/60 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Payout Pekerja
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  Rp{settlement.freelancer_payout.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="flex flex-col gap-1 rounded-xl border border-border/40 bg-background/60 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Refund Klien
                </span>
                <span className="font-bold text-foreground text-sm">
                  Rp{settlement.client_refund.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </AppPageCard>
        )}
      </div>

      {confirmDialog}
    </AppPage>
  );
}
