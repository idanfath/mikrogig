import { Fragment, useEffect, useState } from 'react';
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
  generateAiOverview,
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
import { useIsMobile } from '@/hooks/use-mobile';
import { useServerClock } from '@/hooks/use-server-clock';
import { formatDate } from '@/lib/date';
import { capitalize, cn } from '@/lib/utils';
import { show as showProfile } from '@/routes/app/profile';
import { show as showConversation } from '@/routes/app/gig_conversations';
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
import {
  AiEvidenceImageDialog,
  AiEvidenceSnapshotDialog,
  GigDisputeAiOverviewPanel,
} from './gig-dispute-ai-overview';
import type {
  AiEvidenceTarget,
  GigDisputeAiOverview,
} from './gig-dispute-ai-overview';
import { GigConversation } from './gig-conversation';

type QueueDispute = {
  id: number;
  type: string;
  status: string;
  reporter: {
    id: number;
    name: string;
    role?: string | null;
    avatar_url?: string;
    location?: string | null;
  };
  respondent: {
    id: number;
    name: string;
    role?: string | null;
    avatar_url?: string;
    location?: string | null;
  };
  counterproof_due_at: string;
  gig?: { id: number; title: string };
};

function CounterproofDeadline({
  dueAt,
  serverNow,
}: {
  dueAt: string;
  serverNow: string;
}) {
  const isExpired = new Date(serverNow).getTime() >= new Date(dueAt).getTime();

  return (
    <>
      <span className="text-xs font-semibold text-foreground sm:text-sm">
        {formatDate(dueAt, 'dd MMMM yyyy · HH:mm')}
      </span>
      <span className="text-[11px] text-muted-foreground">
        {isExpired
          ? 'Menunggu resolusi otomatis'
          : `Sisa ${getServerCountdown(dueAt, serverNow)}`}
      </span>
    </>
  );
}

export function AdminGigDisputeQueue({
  disputes,
  filters,
  server_now: serverNow,
}: {
  disputes: { data: QueueDispute[] };
  filters: { status: string | null; type: string | null };
  server_now: string;
}) {
  const [search, setSearch] = useState('');
  const currentServerTime = useServerClock(serverNow);
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
  const activeDisputes = filteredDisputes.filter(
    (dispute) => dispute.status !== GigDisputeStatus.Resolved,
  );
  const historyDisputes = filteredDisputes.filter(
    (dispute) => dispute.status === GigDisputeStatus.Resolved,
  );

  useEffect(() => {
    const deadline = disputes.data
      .filter(
        (dispute) => dispute.status === GigDisputeStatus.AwaitingCounterproof,
      )
      .map((dispute) => new Date(dispute.counterproof_due_at).getTime())
      .filter((dueAt) => dueAt > new Date(serverNow).getTime())
      .sort((first, second) => first - second)[0];

    if (deadline === undefined) {
      return;
    }

    const serverOffset = new Date(serverNow).getTime() - Date.now();
    const timer = window.setTimeout(
      () => router.reload({ only: ['disputes', 'server_now'] }),
      deadline - (Date.now() + serverOffset) + 50,
    );

    return () => window.clearTimeout(timer);
  }, [disputes.data, serverNow]);

  return (
    <AppPage
      title="Sengketa Admin"
      description="Tinjau sengketa aktif dan riwayat penyelesaiannya."
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
                <span className="text-xs font-semibold text-foreground">
                  Status Sengketa
                </span>
                <Select
                  value={filters.status ?? 'all'}
                  onValueChange={(val) =>
                    applyFilters(val === 'all' ? '' : val, filters.type ?? '')
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Semua sengketa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua sengketa</SelectItem>
                    <SelectItem value={GigDisputeStatus.AwaitingCounterproof}>
                      Menunggu Counterproof
                    </SelectItem>
                    <SelectItem value={GigDisputeStatus.AwaitingAdmin}>
                      Menunggu Admin
                    </SelectItem>
                    <SelectItem value={GigDisputeStatus.Resolved}>
                      Riwayat selesai
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-foreground">
                  Jenis Sengketa
                </span>
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
                    <SelectItem value={GigDisputeType.NoShow}>
                      Pekerja Tidak Hadir
                    </SelectItem>
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
                <div className="flex justify-end pt-1 sm:col-span-2">
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
            <ShieldAlert className="mb-3 size-12 text-muted-foreground/50" />
            <h3 className="mb-1 text-base font-bold text-foreground">
              Tidak Ada Sengketa
            </h3>
            <p className="max-w-sm text-xs text-muted-foreground">
              {hasActiveFilters
                ? 'Tidak ada sengketa yang sesuai dengan kata kunci atau filter yang Anda pilih.'
                : 'Saat ini belum ada sengketa.'}
            </p>
          </AppPageCard>
        ) : (
          <div className="flex flex-col gap-4">
            {activeDisputes.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500" />
                <h2 className="text-xs font-bold tracking-wider text-foreground uppercase">
                  Sengketa Aktif ({activeDisputes.length})
                </h2>
              </div>
            )}

            {filteredDisputes.map((dispute, index) => (
              <Fragment key={dispute.id}>
                {historyDisputes.length > 0 &&
                  index === activeDisputes.length && (
                    <div className="relative my-2">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-3 font-semibold tracking-wider text-muted-foreground">
                          Riwayat / Non-Aktif ({historyDisputes.length})
                        </span>
                      </div>
                    </div>
                  )}

                <AppPageCard className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-foreground sm:text-base">
                        {getGigDisputeTypeLabel(dispute.type)}
                      </span>
                      <Badge
                        variant={getGigDisputeStatusVariant(dispute.status)}
                        className="px-2.5 py-0.5 text-xs font-medium"
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
                      href={
                        showProfile({
                          user: dispute.reporter.id,
                        }).url
                      }
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
                            Pelapor
                            {dispute.reporter.role
                              ? ` · ${getUserRoleLabel(dispute.reporter.role)}`
                              : ''}
                          </span>
                          <span className="truncate text-xs font-semibold text-foreground sm:text-sm">
                            {dispute.reporter.name}
                          </span>
                          {dispute.reporter.location && (
                            <span className="truncate text-[11px] text-muted-foreground">
                              {capitalize(dispute.reporter.location, true)}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </Link>

                    <Link
                      href={
                        showProfile({
                          user: dispute.respondent.id,
                        }).url
                      }
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
                            Responden
                            {dispute.respondent.role
                              ? ` · ${getUserRoleLabel(dispute.respondent.role)}`
                              : ''}
                          </span>
                          <span className="truncate text-xs font-semibold text-foreground sm:text-sm">
                            {dispute.respondent.name}
                          </span>
                          {dispute.respondent.location && (
                            <span className="truncate text-[11px] text-muted-foreground">
                              {capitalize(dispute.respondent.location, true)}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </Link>

                    {dispute.status ===
                      GigDisputeStatus.AwaitingCounterproof && (
                      <div className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-card p-3">
                        <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                            Batas Counterproof
                          </span>
                          <CounterproofDeadline
                            dueAt={dispute.counterproof_due_at}
                            serverNow={currentServerTime}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </AppPageCard>
              </Fragment>
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
  ai_overview: aiOverview,
  capabilities,
  conversation,
  server_now: serverNow,
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
  ai_overview: GigDisputeAiOverview | null;
  capabilities: {
    canResolveDispute: boolean;
    canGenerateAiOverview: boolean;
  };
  conversation: GigConversationData;
  server_now: string;
}) {
  const [confirm, confirmDialog] = useConfirm();
  const isMobile = useIsMobile();
  const [activeSnapshot, setActiveSnapshot] = useState<
    Extract<AiEvidenceTarget, { kind: 'snapshot' }> | null
  >(null);
  const [activeImage, setActiveImage] = useState<
    Extract<AiEvidenceTarget, { kind: 'image' }> | null
  >(null);
  const [highlightedAnchor, setHighlightedAnchor] = useState<string | null>(null);
  const [chatFocusRequest, setChatFocusRequest] = useState<{
    messageId: number;
    sequence: number;
  } | null>(null);
  const currentServerTime = useServerClock(serverNow);
  const aiOverviewForm = useForm({});
  const form = useForm<{
    finding: GigDisputeFindingValue;
    inconclusive_outcome: GigSettlementOutcomeValue | null;
    resolution_note: string;
  }>({
    finding: GigDisputeFinding.FreelancerAtFault,
    inconclusive_outcome: null,
    resolution_note: '',
  });

  useEffect(() => {
    if (dispute.status !== GigDisputeStatus.AwaitingCounterproof) {
      return;
    }

    const serverOffset = new Date(serverNow).getTime() - Date.now();
    const delay =
      new Date(dispute.counterproof_due_at).getTime() -
      (Date.now() + serverOffset);

    if (delay <= 0) {
      router.reload();

      return;
    }

    const timer = setTimeout(() => {
      router.reload();
    }, delay);

    return () => clearTimeout(timer);
  }, [dispute.counterproof_due_at, dispute.status, serverNow]);

  const handleResolve = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.data.resolution_note.trim()) {
      form.setError(
        'resolution_note',
        'Alasan keputusan sengketa wajib diisi.',
      );

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

  const requestAiOverview = () => {
    aiOverviewForm.post(generateAiOverview.url(dispute), {
      preserveScroll: true,
    });
  };

  const focusPageSource = (anchor: string) => {
    setActiveImage(null);
    setActiveSnapshot(null);
    setHighlightedAnchor(anchor);

    requestAnimationFrame(() => {
      document.getElementById(anchor)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });

    window.setTimeout(() => {
      setHighlightedAnchor((current) => current === anchor ? null : current);
    }, 2500);
  };

  const handleAiReference = (
    _reference: string,
    target: AiEvidenceTarget,
  ) => {
    switch (target.kind) {
      case 'chat_message':
        if (isMobile) {
          router.visit(showConversation.url(conversation.agreement_id, {
            query: { chat_focus: target.message_id },
          }));

          return;
        }

        setChatFocusRequest((current) => ({
          messageId: target.message_id,
          sequence: (current?.sequence ?? 0) + 1,
        }));

        return;
      case 'image':
        setActiveSnapshot(null);
        setActiveImage(target);

        return;
      case 'page_source':
        focusPageSource(target.anchor);

        return;
      case 'snapshot':
        setActiveImage(null);
        setActiveSnapshot(target);
    }
  };

  const handleEvidenceSource = (reference: string) => {
    const target = aiOverview?.evidence_targets[reference];

    if (target !== undefined) {
      handleAiReference(reference, target);
    }
  };

  return (
    <AppPage
      title="Detail Sengketa Pekerjaan"
      description="Tinjau bukti dari pelapor dan responden sebelum memberikan keputusan sengketa."
    >
      <div className="flex flex-col gap-6">
        <AppPageCard
          id="ai-source-DIS-01"
          className={cn(
            'flex flex-col gap-4 transition-colors',
            highlightedAnchor === 'ai-source-DIS-01' && 'ring-2 ring-primary/40',
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-foreground sm:text-base">
                {getGigDisputeTypeLabel(dispute.type)}
              </span>
              <Badge
                variant={getGigDisputeStatusVariant(dispute.status)}
                className="px-3 py-1 text-xs font-medium"
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
                    Pelapor
                    {dispute.reporter.role
                      ? ` · ${getUserRoleLabel(dispute.reporter.role)}`
                      : ''}
                  </span>
                  <span className="truncate text-xs font-semibold text-foreground sm:text-sm">
                    {dispute.reporter.name}
                  </span>
                  {dispute.reporter.location && (
                    <span className="truncate text-[11px] text-muted-foreground">
                      {capitalize(dispute.reporter.location, true)}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
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
                    Responden
                    {dispute.respondent.role
                      ? ` · ${getUserRoleLabel(dispute.respondent.role)}`
                      : ''}
                  </span>
                  <span className="truncate text-xs font-semibold text-foreground sm:text-sm">
                    {dispute.respondent.name}
                  </span>
                  {dispute.respondent.location && (
                    <span className="truncate text-[11px] text-muted-foreground">
                      {capitalize(dispute.respondent.location, true)}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>

            {dispute.status === GigDisputeStatus.AwaitingCounterproof && (
              <div className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-card p-3">
                <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    Batas Counterproof
                  </span>
                  <CounterproofDeadline
                    dueAt={dispute.counterproof_due_at}
                    serverNow={currentServerTime}
                  />
                </div>
              </div>
            )}

            {dispute.status === GigDisputeStatus.AwaitingAdmin && (
              <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    Status Peninjauan
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    Counterproof sudah diterima, menunggu keputusan admin.
                  </span>
                </div>
              </div>
            )}
          </div>
        </AppPageCard>

        <GigDisputeAiOverviewPanel
          overview={aiOverview}
          canGenerate={capabilities.canGenerateAiOverview}
          processing={aiOverviewForm.processing}
          onGenerate={requestAiOverview}
          onReference={handleAiReference}
        />

        <AiEvidenceSnapshotDialog
          evidence={activeSnapshot}
          onOpenChange={(open) => {
            if (!open) {
              setActiveSnapshot(null);
            }
          }}
          onCurrentSource={focusPageSource}
        />

        <AiEvidenceImageDialog
          evidence={activeImage}
          onOpenChange={(open) => {
            if (!open) {
              setActiveImage(null);
            }
          }}
          onSource={handleEvidenceSource}
          sourceLabel={
            activeImage?.source_reference
            && aiOverview?.evidence_targets[activeImage.source_reference]?.kind === 'chat_message'
              ? 'Lihat pesan sumber'
              : undefined
          }
        />

        {dispute.finish_request && (
          <AppPageCard
            id="ai-source-FIN-01"
            className={cn(
              'flex flex-col gap-3 transition-colors',
              highlightedAnchor === 'ai-source-FIN-01' && 'ring-2 ring-primary/40',
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
              <div className="flex items-center gap-2">
                <FileCheck className="size-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  Bukti Pengiriman Hasil Pekerjaan
                </h3>
              </div>
              <Badge variant="outline" className="text-xs font-semibold">
                {dispute.respondent.name}
              </Badge>
            </div>

            <div className="rounded-xl border border-border/40 bg-muted/30 p-3.5 text-xs leading-relaxed whitespace-pre-wrap text-foreground">
              {dispute.finish_request.completion_note}
            </div>

            {dispute.finish_request.rejection_reason && (
              <div className="flex flex-col gap-1 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive">
                <span className="font-bold">
                  Alasan Penolakan Hasil oleh Klien:
                </span>
                <p className="leading-relaxed whitespace-pre-wrap">
                  {dispute.finish_request.rejection_reason}
                </p>
              </div>
            )}

            {dispute.finish_request.media.length > 0 && (
              <div className="flex flex-col gap-2 pt-1">
                <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  Lampiran Foto Bukti Hasil (
                  {dispute.finish_request.media.length})
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

        {dispute.submissions.map((submission, index) => {
          const isReporter = submission.submitted_by
            ? submission.submitted_by === dispute.reporter.id
            : submission.type === 'report';
          const author = isReporter ? dispute.reporter : dispute.respondent;
          const evidenceAnchor = `ai-source-SUB-${String(index + 1).padStart(2, '0')}`;

          return (
            <AppPageCard
              key={submission.id}
              id={evidenceAnchor}
              className={cn(
                'flex flex-col gap-3 transition-colors',
                highlightedAnchor === evidenceAnchor && 'ring-2 ring-primary/40',
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">
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

              <div className="rounded-xl border border-border/40 bg-muted/30 p-3.5 text-xs leading-relaxed whitespace-pre-wrap text-foreground">
                {submission.statement}
              </div>

              {submission.media.length > 0 && (
                <div className="flex flex-col gap-2 pt-1">
                  <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
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

        <GigConversation
          conversation={conversation}
          focusRequest={chatFocusRequest}
          onFocusCleared={() => setChatFocusRequest(null)}
        />

        {dispute.resolution_note && (
          <AppPageCard className="flex flex-col gap-3 border-emerald-500/30 bg-emerald-500/5">
            <div className="flex items-center gap-2 border-b border-emerald-500/20 pb-2 text-emerald-900 dark:text-emerald-200">
              <Scale className="size-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-base font-bold">Hasil Keputusan Admin</h3>
            </div>

            {dispute.finding && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">
                  Temuan Sengketa:
                </span>
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 text-xs font-semibold"
                >
                  {getGigDisputeFindingLabel(dispute.finding)}
                </Badge>
              </div>
            )}

            <div className="rounded-xl border border-emerald-500/20 bg-background/60 p-3.5 text-xs leading-relaxed whitespace-pre-wrap text-foreground">
              {dispute.resolution_note}
            </div>
          </AppPageCard>
        )}

        {capabilities.canResolveDispute && (
          <AppPageCard className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-border/40 pb-2">
              <Scale className="size-5 text-primary" />
              <h3 className="text-base font-bold text-foreground">
                Form Keputusan Sengketa Admin
              </h3>
            </div>

            <form
              onSubmit={handleResolve}
              className="flex flex-col gap-4"
            >
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="finding">
                    Temuan Pihak Bersalah
                  </FieldLabel>
                  <Select
                    value={form.data.finding}
                    onValueChange={(value) => {
                      const finding = value as GigDisputeFindingValue;

                      form.setData((data) => ({
                        ...data,
                        finding,
                        inconclusive_outcome:
                          finding === GigDisputeFinding.Inconclusive
                            ? data.inconclusive_outcome
                            : null,
                      }));
                    }}
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
                      value={form.data.inconclusive_outcome ?? undefined}
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
                        <SelectItem
                          value={GigSettlementOutcome.FullClientRefund}
                        >
                          Refund Penuh Klien (100% Klien)
                        </SelectItem>
                        <SelectItem value={GigSettlementOutcome.ThirtySeventy}>
                          Pembagian 30% Pekerja / 70% Klien
                        </SelectItem>
                        <SelectItem
                          value={GigSettlementOutcome.FullFreelancerPayout}
                        >
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
                    <span className="text-xs font-medium text-destructive">
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
              <h3 className="text-base font-bold">Settlement Dana Escrow</h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1 rounded-xl border border-border/40 bg-background/60 p-3">
                <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  Keputusan Outcome
                </span>
                <span className="text-sm font-bold text-foreground">
                  {getGigSettlementOutcomeLabel(settlement.outcome)}
                </span>
              </div>

              <div className="flex flex-col gap-1 rounded-xl border border-border/40 bg-background/60 p-3">
                <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  Payout Pekerja
                </span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  Rp
                  {settlement.freelancer_payout.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="flex flex-col gap-1 rounded-xl border border-border/40 bg-background/60 p-3">
                <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  Refund Klien
                </span>
                <span className="text-sm font-bold text-foreground">
                  Rp
                  {settlement.client_refund.toLocaleString('id-ID')}
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
