import { router, useForm, usePage, usePoll } from '@inertiajs/react';
import { Info, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  markRead,
  store,
} from '@/actions/App/Http/Controllers/GigConversationController';
import { AppPageCard } from '@/components/layout/app-page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/date';
import { sentenceCase } from '@/lib/utils';
import type { Auth } from '@/types/auth';
import {
  GigMessageKind,
  getGigDisputeTypeLabel,
  getGigWorkflowEventLabel,
} from '@/types/enum';
import type {
  ConversationMessage,
  GigConversation as GigConversationData,
} from '../conversation-types';

function getEventActor(
  workflowEvent: string | null,
  snapshot: Record<string, unknown> | null,
): 'client' | 'freelancer' | 'admin' | 'system' {
  if (!workflowEvent) return 'system';

  switch (workflowEvent) {
    case 'freelancer_selected':
    case 'agreement_terms_submitted':
    case 'agreement_changes_requested':
    case 'payment_pending':
    case 'payment_confirmed':
    case 'payment_cancelled':
    case 'finish_rejected':
    case 'gig_cancelled':
    case 'selected_freelancer_rejected':
      return 'client';

    case 'agreement_accepted':
    case 'agreement_declined':
    case 'freelancer_left':
    case 'work_started':
    case 'finish_submitted':
    case 'counterproof_submitted':
      return 'freelancer';

    case 'exit_requested':
    case 'exit_withdrawn':
      return snapshot?.type === 'freelancer_cancellation' ? 'freelancer' : 'client';

    case 'exit_refused':
    case 'exit_accepted':
      return snapshot?.type === 'client_cancellation' ? 'freelancer' : 'client';

    case 'dispute_resolved':
      return 'admin';

    case 'dispute_opened':
      return 'client';

    default:
      return 'system';
  }
}

function formatSnapshotKey(key: string): string {
  const keyMap: Record<string, string> = {
    type: 'Jenis',
    counterproof_due_at: 'Batas Counterproof',
    amount: 'Jumlah',
    currency: 'Mata Uang',
    final_total_price: 'Total Biaya',
    accepted_fee: 'Tarif Disetujui',
    terms_version: 'Versi Ketentuan',
    final_scope: 'Cakupan Pekerjaan',
    work_date: 'Tanggal Kerja',
    start_time: 'Jam Mulai',
    location_arrangement: 'Lokasi',
    delivery_expectations: 'Hasil Ekspektasi',
    reason: 'Alasan',
    execution_mode: 'Mode Eksekusi',
  };

  return keyMap[key] ?? sentenceCase(key.replaceAll('_', ' '));
}

function formatSnapshotValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '-';

  const strVal = String(value);

  if (
    key.includes('price') ||
    key.includes('fee') ||
    key.includes('amount') ||
    key.includes('payout') ||
    key.includes('refund')
  ) {
    const num = Number(value);
    if (!isNaN(num) && num > 0) {
      return `Rp ${num.toLocaleString('id-ID')}`;
    }
  }

  if (key === 'type') {
    return getGigDisputeTypeLabel(strVal) || sentenceCase(strVal.replaceAll('_', ' '));
  }

  if (key.includes('at') || key.includes('date')) {
    if (strVal.includes('T') || strVal.includes('-')) {
      const parsedDate = new Date(strVal);
      if (!isNaN(parsedDate.getTime())) {
        return formatDate(strVal, 'dd MMM yyyy · HH:mm');
      }
    }
  }

  return strVal;
}

function getWorkflowEventTitle(
  eventTitle: string | null,
  workflowEvent: string | null,
): string {
  if (eventTitle && eventTitle.trim().length > 0) {
    return eventTitle;
  }

  return getGigWorkflowEventLabel(workflowEvent) || 'Pemberitahuan Sistem';
}

type Props = {
  conversation: GigConversationData | null;
};

export function GigConversation({ conversation }: Props) {
  const { auth } = usePage<{ auth?: Auth }>().props;
  const currentUserId = auth?.user?.id;
  const viewerRole = auth?.user?.role;
  const isAdmin = viewerRole === 'admin';
  const isClientViewer = viewerRole === 'client';
  const [olderMessages, setOlderMessages] = useState<ConversationMessage[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const markedReadKey = useRef('');
  const form = useForm<{ body: string; images: File[] }>({
    body: '',
    images: [],
  });

  const messages = useMemo(() => {
    const merged = new Map(
      olderMessages.map((message) => [message.id, message]),
    );
    conversation?.messages.forEach((message) =>
      merged.set(message.id, message),
    );

    return [...merged.values()].sort((left, right) => left.id - right.id);
  }, [conversation?.messages, olderMessages]);

  useEffect(() => {
    if (nearBottom.current) {
      listRef.current?.scrollTo({
        top: listRef.current.scrollHeight,
      });
    }
  }, [messages.length]);

  useEffect(() => {
    return () => previews.forEach((preview) => URL.revokeObjectURL(preview));
  }, [previews]);

  const unreadKey = useMemo(
    () =>
      messages
        .filter((message) => message.recipient_id !== null && !message.read_at)
        .map((message) => message.id)
        .join(','),
    [messages],
  );

  useEffect(() => {
    if (
      !conversation?.capabilities.canMarkRead ||
      unreadKey === '' ||
      unreadKey === markedReadKey.current
    ) {
      return;
    }

    markedReadKey.current = unreadKey;
    router.post(
      markRead.url(conversation.agreement_id),
      {},
      {
        only: ['conversation'],
        preserveScroll: true,
        preserveState: true,
      },
    );
  }, [
    conversation?.agreement_id,
    conversation?.capabilities.canMarkRead,
    unreadKey,
  ]);

  const { start, stop } = usePoll(
    3000,
    {
      only: ['conversation'],
    },
    { keepAlive: false },
  );

  useEffect(() => {
    const updatePolling = () => {
      if (document.visibilityState === 'hidden') {
        stop();
      } else {
        start();
      }
    };

    document.addEventListener('visibilitychange', updatePolling);

    return () =>
      document.removeEventListener('visibilitychange', updatePolling);
  }, [start, stop]);

  if (!conversation?.capabilities.canViewConversation) {
    return null;
  }

  const selectImages = (files: File[]) => {
    previews.forEach((preview) => URL.revokeObjectURL(preview));
    form.setData('images', files);
    setPreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const leftPerson = isClientViewer
    ? conversation.participants[1] ?? conversation.participants[0]
    : conversation.participants[0];

  const rightPerson = isClientViewer
    ? conversation.participants[0]
    : conversation.participants[1] ?? conversation.participants[0];

  return (
    <AppPageCard id="conversation" className="p-0 overflow-hidden flex flex-col">
      {/* Header / Title */}
      <div className="flex flex-col gap-1.5 border-b border-border/60 bg-card px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-foreground sm:text-base">
            Percakapan Gig
          </h2>
          {conversation.has_older && (
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="text-xs"
              onClick={() => {
                router.get(
                  window.location.pathname,
                  { chat_before: conversation.oldest_id },
                  {
                    only: ['conversation'],
                    preserveScroll: true,
                    preserveState: true,
                    replace: true,
                    onSuccess: (page) => {
                      const batch = page.props.conversation as GigConversationData;
                      setOlderMessages((current) => {
                        const merged = new Map(
                          current.map((message) => [message.id, message]),
                        );
                        batch.messages.forEach((message) =>
                          merged.set(message.id, message),
                        );

                        return [...merged.values()].sort(
                          (left, right) => left.id - right.id,
                        );
                      });
                      window.history.replaceState({}, '', window.location.pathname);
                    },
                  },
                );
              }}
            >
              Muat pesan sebelumnya
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground font-medium">
          <span>{leftPerson?.name}</span>
          <span>{rightPerson?.name}</span>
        </div>
      </div>

      {/* Chat Body */}
      <div
        ref={listRef}
        onScroll={(event) => {
          const element = event.currentTarget;
          nearBottom.current =
            element.scrollHeight - element.scrollTop - element.clientHeight <
            80;
        }}
        className="flex max-h-[32rem] min-h-[16rem] flex-col gap-3 overflow-y-auto bg-muted/15 p-4 sm:p-6"
      >
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Belum ada pesan.
          </p>
        )}
        {messages.map((message) => {
          if (message.kind === GigMessageKind.System) {
            const actor = getEventActor(
              message.workflow_event,
              message.event_snapshot,
            );
            const title = getWorkflowEventTitle(
              message.event_title,
              message.workflow_event,
            );

            let systemAlignment = 'mx-auto max-w-md text-center';
            if (actor === 'client') {
              systemAlignment = isClientViewer ? 'self-end text-right' : 'self-start text-left';
            } else if (actor === 'freelancer') {
              systemAlignment = isClientViewer ? 'self-start text-left' : 'self-end text-right';
            }

            return (
              <article
                key={message.id}
                className={`max-w-[85%] sm:max-w-[75%] rounded-xl border bg-muted/50 p-3 text-xs text-foreground ${systemAlignment}`}
              >
                <p className="font-semibold text-foreground">{title}</p>

                {message.event_snapshot &&
                  Object.entries(message.event_snapshot).map(([key, value]) => (
                    <p key={key} className="mt-0.5 text-[11px] text-muted-foreground">
                      {formatSnapshotKey(key)}: {formatSnapshotValue(key, value)}
                    </p>
                  ))}

                <time className="mt-1 block text-[10px] text-muted-foreground">
                  {formatDate(message.created_at, 'dd MMM yyyy · HH:mm')}
                </time>

                {message.event_action && (
                  <div className="mt-2">
                    <Button asChild variant="outline" size="xs" className="text-xs">
                      <a href={message.event_action.url}>{message.event_action.label}</a>
                    </Button>
                  </div>
                )}
              </article>
            );
          }

          const isOwn = currentUserId !== undefined && message.sender?.id === currentUserId;
          const isRightAligned = isAdmin
            ? conversation.participants.length > 1 && message.sender?.id === conversation.participants[1]?.id
            : isOwn;

          return (
            <article
              key={message.id}
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 shadow-xs transition-colors ${
                isRightAligned
                  ? 'self-end bg-primary text-primary-foreground rounded-tr-xs'
                  : 'self-start bg-card border border-border/60 text-foreground rounded-tl-xs'
              }`}
            >
              <p
                className={`text-xs font-bold ${
                  isRightAligned ? 'text-primary-foreground/90' : 'text-foreground'
                }`}
              >
                {message.sender?.name}
              </p>
              {message.body && (
                <p
                  className={`mt-1 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    isRightAligned ? 'text-primary-foreground' : 'text-foreground'
                  }`}
                >
                  {message.body}
                </p>
              )}
              {message.media.length > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {message.media.map((media) => (
                    <a
                      key={media.id}
                      href={media.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={media.url}
                        alt="Lampiran percakapan"
                        className="aspect-square w-full rounded-lg border border-border/40 object-cover transition-opacity hover:opacity-90"
                      />
                    </a>
                  ))}
                </div>
              )}
              <time
                className={`mt-1.5 block text-[10px] ${
                  isRightAligned ? 'text-primary-foreground/75' : 'text-muted-foreground'
                }`}
              >
                {new Date(message.created_at).toLocaleString('id-ID')}
              </time>
            </article>
          );
        })}
      </div>

      {/* Footer / Input */}
      {conversation.capabilities.isReadOnly && (
        <div className="border-t border-border/60 bg-muted/40 p-4 text-center text-xs text-muted-foreground">
          Percakapan ini telah ditutup dan hanya dapat dibaca.
        </div>
      )}

      {conversation.capabilities.canSendMessage && (
        <form
          className="flex flex-col gap-3 border-t border-border/60 bg-card p-3 sm:p-4"
          onSubmit={(event) => {
            event.preventDefault();
            form.post(store.url(conversation.agreement_id), {
              forceFormData: true,
              preserveScroll: true,
              onSuccess: () => {
                form.reset();
                previews.forEach((preview) => URL.revokeObjectURL(preview));
                setPreviews([]);
              },
            });
          }}
        >
          <Textarea
            maxLength={2000}
            placeholder="Tulis pesan..."
            value={form.data.body}
            onChange={(event) => form.setData('body', event.target.value)}
            className="min-h-[60px] text-xs sm:text-sm"
          />
          {form.errors.body && (
            <p className="text-xs text-destructive">{form.errors.body}</p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={(event) =>
                  selectImages(Array.from(event.target.files ?? []).slice(0, 5))
                }
                className="text-xs max-w-[220px]"
              />
              {previews.length > 0 && (
                <span className="text-xs font-medium text-muted-foreground">
                  {previews.length} foto dipilih
                </span>
              )}
            </div>

            <Button type="submit" size="sm" disabled={form.processing}>
              {form.processing ? 'Mengirim...' : 'Kirim pesan'}
            </Button>
          </div>

          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 pt-2">
              {previews.map((preview, index) => (
                <div key={preview} className="relative group">
                  <img
                    src={preview}
                    alt={`Pratinjau ${index + 1}`}
                    className="aspect-square rounded-lg border border-border/60 object-cover"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="absolute top-1 right-1 size-6 p-0 rounded-full opacity-90 hover:opacity-100"
                    onClick={() => {
                      const next = form.data.images.filter(
                        (_, imageIndex) => imageIndex !== index,
                      );
                      selectImages(next);
                    }}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}

          {form.errors.images && (
            <p className="text-xs text-destructive">{form.errors.images}</p>
          )}
          {form.progress && (
            <p className="text-xs text-muted-foreground">
              Mengunggah {form.progress.percentage}%
            </p>
          )}
        </form>
      )}
    </AppPageCard>
  );
}
