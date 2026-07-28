import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Clock3,
  FileSearch,
  FileText,
  GitCompareArrows,
  Image as ImageIcon,
  ListChecks,
  LoaderCircle,
  MessageSquareText,
  Scale,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';

import { AppPageCard } from '@/components/layout/app-page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatDate } from '@/lib/date';
import { cn, sentenceCase } from '@/lib/utils';
import {
  GigDisputeAiOverviewStatus,
  getGigDisputeAiOverviewStatusLabel,
  getGigWorkflowEventLabel,
} from '@/types/enum';

const sectionMeta = {
  neutral_summary: { label: 'Ringkasan netral', icon: FileSearch },
  chronology: { label: 'Kronologi', icon: Clock3 },
  reporter_position: { label: 'Keterangan pelapor', icon: MessageSquareText },
  respondent_position: { label: 'Keterangan responden', icon: MessageSquareText },
  consistent_facts: { label: 'Fakta yang saling menguatkan', icon: CheckCircle2 },
  contradictions: { label: 'Hal yang perlu dibandingkan', icon: GitCompareArrows },
  uncertain_items: { label: 'Hal yang belum jelas', icon: CircleHelp },
  admin_review_focus: { label: 'Fokus peninjauan admin', icon: ListChecks },
} as const;

const evidenceLabels: Record<string, string> = {
  reference: 'Referensi',
  party: 'Pihak',
  body: 'Isi pesan',
  statement: 'Pernyataan',
  completion_note: 'Catatan penyelesaian',
  rejection_reason: 'Alasan penolakan',
  reason: 'Alasan',
  event: 'Peristiwa',
  type: 'Jenis',
  status: 'Status',
  title: 'Judul',
  work_date: 'Tanggal kerja',
  start_time: 'Jam mulai',
  location_arrangement: 'Lokasi',
  final_total_price: 'Total biaya',
  accepted_fee: 'Tarif disetujui',
  terms_version: 'Versi ketentuan',
  counterproof_due_at: 'Batas counterproof',
  review_due_at: 'Batas peninjauan',
  submitted_at: 'Dikirim',
  sent_at: 'Dikirim',
  created_at: 'Dicatat',
  opened_at: 'Dibuka',
  responded_at: 'Ditanggapi',
  withdrawn_at: 'Ditarik',
  executed_at: 'Dieksekusi',
  accepted_at: 'Diterima',
  rejected_at: 'Ditolak',
  closed_at: 'Waktu ditutup',
  started_at: 'Waktu mulai',
  cancelled_at: 'Waktu dibatalkan',
  photos: 'Lampiran foto',
  attachments: 'Lampiran',
  media: 'Lampiran',
  snapshot: 'Ringkasan peristiwa',
};

type OverviewSegment =
  | { type: 'text'; text: string }
  | { type: 'evidence_ref'; reference: string };

type OverviewItem = { segments: OverviewSegment[] };

export type AiEvidenceTarget =
  | {
    kind: 'chat_message';
    message_id: number;
    label: string;
    context: string;
  }
  | {
    kind: 'image';
    url: string;
    label: string;
    context: string;
    source_reference?: string;
  }
  | {
    kind: 'page_source';
    anchor: string;
    label: string;
    context: string;
  }
  | {
    kind: 'snapshot';
    label: string;
    context: string;
    captured_at: string;
    fields: Record<string, unknown>;
    current_anchor?: string;
  };

export type GigDisputeAiOverview = {
  id: number;
  status: string;
  model: string;
  prompt_version: string;
  schema_version: string;
  failure_detail: string | null;
  queued_at: string | null;
  processing_at: string | null;
  completed_at: string | null;
  repair_attempted_at: string | null;
  coverage: {
    human_message_total?: number;
    human_message_selected?: number;
    human_message_middle_omitted?: number;
    system_event_total?: number;
    image_omissions?: unknown[];
  } | null;
  result: Record<string, OverviewItem[]> | null;
  evidence_targets: Record<string, AiEvidenceTarget>;
};

function getStatusVariant(status: string): 'default' | 'destructive' | 'outline' | 'success' {
  switch (status) {
    case GigDisputeAiOverviewStatus.Completed:
      return 'success';
    case GigDisputeAiOverviewStatus.Failed:
      return 'destructive';
    case GigDisputeAiOverviewStatus.Processing:
      return 'default';
    default:
      return 'outline';
  }
}

function getCoverageSummary(coverage: GigDisputeAiOverview['coverage']): string | null {
  if (coverage === null) {
    return null;
  }

  const messagesFullyIncluded =
    coverage.human_message_total === coverage.human_message_selected;
  const imageOmissions = coverage.image_omissions?.length ?? 0;
  const messageSummary = messagesFullyIncluded
    ? 'Seluruh percakapan yang relevan dianalisis.'
    : 'Sebagian percakapan dipilih secara merata agar konteks tetap seimbang.';
  const imageSummary = imageOmissions === 0
    ? 'Lampiran yang dapat dibaca disertakan.'
    : 'Sebagian lampiran tidak dapat disertakan.';

  return `${messageSummary} Semua peristiwa workflow disertakan. ${imageSummary}`;
}

function getEvidenceLabel(key: string): string {
  return evidenceLabels[key] ?? sentenceCase(key.replaceAll('_', ' '));
}

function getEvidenceValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return 'Tidak tersedia';
  }

  if (Array.isArray(value)) {
    return value.length === 0 ? 'Tidak ada' : `${value.length} lampiran tersedia`;
  }

  if (typeof value === 'object') {
    return 'Tersedia untuk ditinjau';
  }

  if (key === 'party') {
    return value === 'reporter' ? 'Pelapor' : value === 'respondent' ? 'Responden' : String(value);
  }

  if (key === 'event') {
    return getGigWorkflowEventLabel(String(value));
  }

  if (key.endsWith('_at')) {
    return formatDate(String(value), 'dd MMMM yyyy · HH:mm');
  }

  return String(value);
}

function getEvidenceTargetStyle(kind: AiEvidenceTarget['kind']) {
  switch (kind) {
    case 'image':
      return {
        icon: ImageIcon,
        className:
          'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300',
      };
    case 'chat_message':
      return {
        icon: MessageSquareText,
        className:
          'border-sky-500/25 bg-sky-500/10 text-sky-700 hover:bg-sky-500/20 dark:text-sky-300',
      };
    case 'page_source':
      return {
        icon: FileText,
        className:
          'border-purple-500/25 bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 dark:text-purple-300',
      };
    case 'snapshot':
      return {
        icon: Clock3,
        className:
          'border-amber-500/25 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300',
      };
  }
}

export function GigDisputeAiOverviewPanel({
  overview,
  canGenerate,
  processing,
  onGenerate,
  onReference,
}: {
  overview: GigDisputeAiOverview | null;
  canGenerate: boolean;
  processing: boolean;
  onGenerate: () => void;
  onReference: (reference: string, target: AiEvidenceTarget) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const isGenerating = overview?.status === GigDisputeAiOverviewStatus.Queued
    || overview?.status === GigDisputeAiOverviewStatus.Processing;
  const canRequest = canGenerate
    && (overview === null || overview.status === GigDisputeAiOverviewStatus.Failed);
  const coverageSummary = getCoverageSummary(overview?.coverage ?? null);

  return (
    <AppPageCard className="overflow-hidden border-primary/20 p-0">
      <div className="flex flex-col gap-4 bg-primary/5 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="size-5" />
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold text-foreground">Ringkasan bukti berbantuan AI</h2>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-muted-foreground hover:text-foreground" aria-label="Tentang ringkasan AI">
                      <CircleHelp className="size-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>AI hanya merapikan bukti. Keputusan tetap sepenuhnya di tangan admin.</TooltipContent>
                </Tooltip>
              </div>
              <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
                Ringkasan ini membantu menemukan konteks dan bukti terkait, bukan menentukan pihak yang benar atau hasil sengketa.
              </p>
            </div>
          </div>

          {overview !== null && (
            <Badge variant={getStatusVariant(overview.status)} size="lg">
              {overview.status === GigDisputeAiOverviewStatus.Completed ? <CheckCircle2 /> : null}
              {overview.status === GigDisputeAiOverviewStatus.Processing ? <LoaderCircle className="animate-spin" /> : null}
              {getGigDisputeAiOverviewStatusLabel(overview.status)}
            </Badge>
          )}
        </div>

        {overview === null && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/15 bg-background/70 p-3.5">
            <p className="text-sm text-muted-foreground">Belum ada ringkasan AI untuk sengketa ini.</p>
            {canRequest && (
              <Button type="button" onClick={onGenerate} disabled={processing}>
                <Sparkles />
                Buat ringkasan bukti
              </Button>
            )}
          </div>
        )}

        {isGenerating && overview !== null && (
          <div className="flex items-start gap-2.5 rounded-xl border border-primary/15 bg-background/75 p-3.5 text-sm text-muted-foreground">
            <LoaderCircle className="mt-0.5 size-4 shrink-0 animate-spin text-primary" />
            <span>
              Ringkasan sedang disusun sejak {formatDate(overview.processing_at ?? overview.queued_at ?? '', 'dd MMM yyyy · HH:mm')}.
              Anda tetap dapat menyelesaikan sengketa tanpa menunggu proses ini.
            </span>
          </div>
        )}

        {overview?.status === GigDisputeAiOverviewStatus.Failed && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3.5">
            <div className="flex min-w-0 items-start gap-2 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{overview.failure_detail}</span>
            </div>
            {canRequest && (
              <Button type="button" variant="outline" onClick={onGenerate} disabled={processing}>
                Coba lagi
              </Button>
            )}
          </div>
        )}
      </div>

      {overview?.status === GigDisputeAiOverviewStatus.Completed && overview.result && (
        <div className="flex flex-col gap-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Scale className="size-4 text-primary" />
              <span>Dibuat {formatDate(overview.completed_at ?? '', 'dd MMMM yyyy · HH:mm')}</span>
            </div>
            <Button type="button" variant="ghost" size="xs" onClick={() => setExpanded((value) => !value)}>
              {expanded ? <ChevronUp /> : <ChevronDown />}
              {expanded ? 'Sembunyikan ringkasan' : 'Tampilkan ringkasan'}
            </Button>
          </div>

          {expanded && (
            <div className="grid gap-3 lg:grid-cols-2">
              {Object.entries(sectionMeta).map(([section, meta]) => {
                const items = overview.result?.[section] ?? [];
                const Icon = meta.icon;

                return (
                  <section key={section} className="flex min-w-0 flex-col gap-3 rounded-xl border border-border/55 bg-muted/20 p-3.5">
                    <div className="flex items-center gap-2 border-b border-border/45 pb-2.5">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="size-4" />
                      </div>
                      <h3 className="text-xs font-bold text-foreground">{meta.label}</h3>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {items.map((item, index) => (
                        <p key={`${section}-${index}`} className="rounded-lg bg-background/80 p-2.5 text-sm leading-relaxed text-foreground">
                          {item.segments.map((segment, segmentIndex) => {
                            if (segment.type === 'text') {
                              return <span key={segmentIndex}>{segment.text}</span>;
                            }

                            const target = overview.evidence_targets[segment.reference];

                            if (target === undefined) {
                              return <span key={segmentIndex}>{segment.reference}</span>;
                            }

                            const targetStyle = getEvidenceTargetStyle(target.kind);
                            const TargetIcon = targetStyle.icon;

                            return (
                              <button
                                key={segmentIndex}
                                type="button"
                                title={target.context}
                                onClick={() => onReference(segment.reference, target)}
                                className={cn(
                                  'mx-1 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold align-baseline transition-colors',
                                  targetStyle.className,
                                )}
                              >
                                <TargetIcon className="size-3 shrink-0" />
                                <span>{target.label}</span>
                              </button>
                            );
                          })}
                        </p>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          {coverageSummary !== null && (
            <div className="flex items-start gap-2.5 rounded-xl border border-border/50 bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
              <CircleHelp className="mt-0.5 size-4 shrink-0" />
              <p>{coverageSummary}</p>
            </div>
          )}
        </div>
      )}
    </AppPageCard>
  );
}

export function AiEvidenceSnapshotDialog({
  evidence,
  onOpenChange,
  onCurrentSource,
}: {
  evidence: Extract<AiEvidenceTarget, { kind: 'snapshot' }> | null;
  onOpenChange: (open: boolean) => void;
  onCurrentSource: (anchor: string) => void;
}) {
  const isMobile = useIsMobile();
  const fields = evidence !== null && (
    <div className="flex flex-col divide-y divide-border/50 rounded-xl border border-border/60 bg-muted/20">
      {Object.entries(evidence.fields).map(([key, value]) => (
        <div key={key} className="grid gap-1 p-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
          <span className="text-xs font-semibold text-muted-foreground">{getEvidenceLabel(key)}</span>
          <span className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{getEvidenceValue(key, value)}</span>
        </div>
      ))}
    </div>
  );
  const currentSourceAction = evidence?.current_anchor && (
    <div className="flex justify-end">
      <Button type="button" variant="outline" onClick={() => onCurrentSource(evidence.current_anchor!)}>
        Lihat keadaan saat ini
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={evidence !== null} onOpenChange={onOpenChange}>
        {evidence !== null && (
          <DrawerContent className="max-h-[80dvh] px-4 pb-6">
            <DrawerHeader className="px-0 text-left">
              <DrawerTitle>{evidence.label}</DrawerTitle>
              <DrawerDescription>
                Keadaan yang dianalisis AI pada {formatDate(evidence.captured_at, 'dd MMMM yyyy · HH:mm')}. {evidence.context}
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex min-h-0 flex-col gap-4 overflow-y-auto pb-1">
              {fields}
              {currentSourceAction}
            </div>
          </DrawerContent>
        )}
      </Drawer>
    );
  }

  return (
    <Dialog open={evidence !== null} onOpenChange={onOpenChange}>
      {evidence !== null && (
        <DialogContent className="max-h-[80dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{evidence.label}</DialogTitle>
            <DialogDescription>
              Keadaan yang dianalisis AI pada {formatDate(evidence.captured_at, 'dd MMMM yyyy · HH:mm')}. {evidence.context}
            </DialogDescription>
          </DialogHeader>
          {fields}
          {currentSourceAction}
        </DialogContent>
      )}
    </Dialog>
  );
}

export function AiEvidenceImageDialog({
  evidence,
  onOpenChange,
  onSource,
  sourceLabel,
}: {
  evidence: Extract<AiEvidenceTarget, { kind: 'image' }> | null;
  onOpenChange: (open: boolean) => void;
  onSource: (reference: string) => void;
  sourceLabel?: string;
}) {
  const isMobile = useIsMobile();
  const image = evidence !== null && (
    <PhotoProvider>
      <PhotoView src={evidence.url}>
        <img
          src={evidence.url}
          alt={evidence.label}
          className="max-h-[65dvh] w-full cursor-zoom-in rounded-sm border border-border/60 object-contain"
        />
      </PhotoView>
    </PhotoProvider>
  );
  const sourceAction = evidence?.source_reference && (
    <div className="flex justify-end">
      <Button type="button" variant="outline" onClick={() => onSource(evidence.source_reference!)}>
        {sourceLabel ?? 'Lihat sumber lampiran'}
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={evidence !== null} onOpenChange={onOpenChange}>
        {evidence !== null && (
          <DrawerContent className="max-h-[80dvh] px-4 pb-6">
            <DrawerHeader className="px-0 text-left">
              <DrawerTitle>{evidence.label}</DrawerTitle>
              <DrawerDescription>{evidence.context}</DrawerDescription>
            </DrawerHeader>
            <div className="flex min-h-0 flex-col gap-4 overflow-y-auto pb-1">
              {image}
              {sourceAction}
            </div>
          </DrawerContent>
        )}
      </Drawer>
    );
  }

  return (
    <Dialog open={evidence !== null} onOpenChange={onOpenChange}>
      {evidence !== null && (
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{evidence.label}</DialogTitle>
            <DialogDescription>{evidence.context}</DialogDescription>
          </DialogHeader>
          {image}
          {sourceAction}
        </DialogContent>
      )}
    </Dialog>
  );
}
