import { router, useForm, usePage, usePoll } from '@inertiajs/react';
import { ChevronDown, ChevronRight, Paperclip, SendHorizontal } from 'lucide-react';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import {
    markRead,
    store,
} from '@/actions/App/Http/Controllers/GigConversationController';
import { AppPageCard } from '@/components/layout/app-page';
import { Button } from '@/components/ui/button';
import { ImagePickerPreviewList } from '@/components/ui/image-picker';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/ui/user-avatar';
import { imageAccept, useImageSelection } from '@/hooks/use-image-selection';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatDate } from '@/lib/date';
import { sentenceCase } from '@/lib/utils';
import type { Auth } from '@/types/auth';
import {
    GigMessageKind,
    GigWorkflowEvent,
    getGigDisputeTypeLabel,
    getGigWorkflowEventLabel,
} from '@/types/enum';
import type {
    ConversationMessage,
    GigConversation as GigConversationData,
} from '../conversation-types';

function getDateKey(dateString: string): string {
    try {
        const date = new Date(dateString);

        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    } catch {
        return dateString;
    }
}

function formatDateDivider(dateString: string): string {
    try {
        const now = new Date();
        const todayStr = getDateKey(now.toISOString());
        const msgDateStr = getDateKey(dateString);

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getDateKey(yesterday.toISOString());

        if (msgDateStr === todayStr) {
            return 'Hari ini';
        }
        if (msgDateStr === yesterdayStr) {
            return 'Kemarin';
        }

        return formatDate(dateString, 'EEEE, d MMMM yyyy');
    } catch {
        return dateString;
    }
}

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
            return snapshot?.type && snapshot.type !== 'no_show' ? 'freelancer' : 'client';

        default:
            return 'system';
    }
}

const EXCLUDED_SNAPSHOT_KEYS = new Set([
    'final_scope',
    'delivery_expectations',
    'reason',
    'completion_note',
    'resolution_note',
    'note',
    'latest_change_request_note',
    'delivery_notes',
]);

function formatSnapshotKey(key: string): string {
    const keyMap: Record<string, string> = {
        type: 'Jenis',
        counterproof_due_at: 'Batas Counterproof',
        review_due_at: 'Batas Peninjauan',
        amount: 'Jumlah',
        currency: 'Mata Uang',
        final_total_price: 'Total Biaya',
        accepted_fee: 'Tarif Disetujui',
        terms_version: 'Versi Ketentuan',
        work_date: 'Tanggal Kerja',
        start_time: 'Jam Mulai',
        location_arrangement: 'Lokasi',
        execution_mode: 'Mode Eksekusi',
        started_at: 'Waktu Mulai',
        cancelled_at: 'Waktu Dibatalkan',
        outcome: 'Hasil',
        finding: 'Keputusan Admin',
        client_refund: 'Pengembalian Klien',
        freelancer_payout: 'Pembayaran Freelancer',
        mode: 'Status',
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
        if (!isNaN(num)) {
            return `Rp ${num.toLocaleString('id-ID')}`;
        }
    }

    if (key === 'type') {
        if (strVal === 'client_cancellation') return 'Pembatalan oleh Klien';
        if (strVal === 'freelancer_abandonment') return 'Pengunduran Diri Freelancer';

        return getGigDisputeTypeLabel(strVal) || sentenceCase(strVal.replaceAll('_', ' '));
    }

    if (key === 'execution_mode') {
        if (strVal === 'agreed') return 'Disetujui Bersama';
        if (strVal === 'unilateral') return 'Sepihak';
    }

    if (key === 'outcome') {
        if (strVal === 'full_client_refund') return 'Pengembalian Dana Klien 100%';
        if (strVal === 'full_freelancer_payout') return 'Pembayaran Freelancer 100%';
        if (strVal === 'split') return 'Pembagian Dana (Split)';
    }

    if (key === 'mode') {
        if (strVal === 'accepted') return 'Disetujui Klien';
        if (strVal === 'auto_accepted') return 'Otomatis Selesai (Sistem)';
    }

    if (key.endsWith('_at') || key.endsWith('_date') || key === 'work_date') {
        if (strVal.includes('T') || strVal.includes('-')) {
            const parsedDate = new Date(strVal);
            if (!isNaN(parsedDate.getTime())) {
                return formatDate(strVal, 'dd MMM yyyy · HH:mm');
            }
        }
    }

    return strVal;
}

function getMediaGridClass(count: number): string {
    if (count === 1) return 'grid-cols-1 w-[180px] sm:w-[220px]';
    if (count === 2) return 'grid-cols-2 w-[240px] sm:w-[280px]';
    if (count === 3) return 'grid-cols-3 w-[260px] sm:w-[320px]';
    if (count === 4) return 'grid-cols-2 w-[240px] sm:w-[280px]';
    if (count === 5) return 'grid-cols-6 w-[270px] sm:w-[330px]';
    return 'grid-cols-3 w-[270px] sm:w-[330px]';
}

function getMediaItemClass(count: number, index: number): string {
    if (count === 5) {
        return index < 3 ? 'col-span-2' : 'col-span-3';
    }
    return '';
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
    defaultExpanded?: boolean;
};

const CHAT_EXPANDED_STORAGE_KEY = 'gig_chat_is_expanded';

export function GigConversation({ conversation, defaultExpanded = true }: Props) {
    const isMobile = useIsMobile();
    const [isExpanded, setIsExpanded] = useState<boolean>(() => {
        try {
            const saved = localStorage.getItem(CHAT_EXPANDED_STORAGE_KEY);
            if (saved !== null) {
                return saved === 'true';
            }
        } catch {
            // fallback if localStorage is unavailable
        }
        return defaultExpanded;
    });

    const toggleExpanded = () => {
        setIsExpanded((prev) => {
            const next = !prev;
            try {
                localStorage.setItem(CHAT_EXPANDED_STORAGE_KEY, String(next));
            } catch {
                // fallback if localStorage is unavailable
            }
            return next;
        });
    };
    const { auth } = usePage<{ auth?: Auth }>().props;
    const currentUserId = auth?.user?.id;
    const viewerRole = auth?.user?.role;
    const isAdmin = viewerRole === 'admin';
    const isClientViewer = viewerRole === 'client';
    const [olderMessages, setOlderMessages] = useState<ConversationMessage[]>([]);
    const listRef = useRef<HTMLDivElement>(null);
    const nearBottom = useRef(true);
    const markedReadKey = useRef('');
    const form = useForm<{ body: string; images: File[] }>({
        body: '',
        images: [],
    });
    const {
        handleFileChange,
        inputRef,
        isDisabled: isImageSelectionDisabled,
        isProcessing: isImageSelectionProcessing,
        items: imageItems,
        remove: removeImage,
        selectionError,
    } = useImageSelection({
        files: form.data.images,
        onFilesChange: (files) => form.setData('images', files),
        maxFiles: 5,
        maxBytes: 5 * 1024 * 1024,
        disabled: form.processing,
    });
    const imageError = form.errors.images ?? selectionError;

    const messages = useMemo<ConversationMessage[]>(() => {
        const merged = new Map<number, ConversationMessage>(
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

    const leftPerson = isClientViewer
        ? conversation.participants[1] ?? conversation.participants[0]
        : conversation.participants[0];

    const rightPerson = isClientViewer
        ? conversation.participants[0]
        : conversation.participants[1] ?? conversation.participants[0];

    const recentMessages = useMemo(() => messages.slice(-5), [messages]);

    return (
        <AppPageCard
            id="conversation"
            className="flex flex-col overflow-hidden p-0"
        >
            {/* Header / Title */}
            <div className="flex flex-col gap-1.5 border-b border-border/60 bg-card px-4 py-3 sm:px-6 sm:py-4">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-bold text-foreground sm:text-base">
                        Percakapan Gig
                    </h2>

                    <div className="flex items-center gap-2">
                        {isExpanded && conversation.has_older && (
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
                        <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            className="gap-1.5 text-xs font-medium text-foreground/80 hover:text-foreground"
                            onClick={toggleExpanded}
                            aria-label={isExpanded ? 'Sembunyikan percakapan' : 'Tampilkan percakapan'}
                        >
                            <span>{isExpanded ? 'Sembunyikan' : 'Buka chat'}</span>
                            <ChevronDown
                                className={`size-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''
                                    }`}
                            />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground font-medium">
                    <span>{leftPerson?.name}</span>
                    <span>{rightPerson?.name}</span>
                </div>

                {!isExpanded && recentMessages.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1.5 border-t border-border/40 pt-2.5">
                        {recentMessages.map((msg) => {
                            const isUser = msg.kind === GigMessageKind.User;
                            const isSelf = isUser && msg.sender?.id === currentUserId;

                            let justifyClass = 'justify-start';
                            let bubbleClass = 'bg-muted/70 text-foreground font-medium rounded-bl-xs';

                            if (isUser) {
                                if (isSelf) {
                                    justifyClass = 'justify-end';
                                    bubbleClass = 'bg-primary/10 text-primary font-medium rounded-br-xs';
                                }
                            } else {
                                const actor = getEventActor(msg.workflow_event, msg.event_snapshot);
                                const sysAlign =
                                    actor === 'client'
                                        ? isClientViewer ? 'self-end' : 'self-start'
                                        : actor === 'freelancer'
                                            ? isClientViewer ? 'self-start' : 'self-end'
                                            : 'self-center';

                                if (sysAlign === 'self-end') {
                                    justifyClass = 'justify-end';
                                } else if (sysAlign === 'self-start') {
                                    justifyClass = 'justify-start';
                                } else {
                                    justifyClass = 'justify-center';
                                }

                                bubbleClass = 'bg-secondary/50 text-muted-foreground border border-border/40 font-medium';
                            }

                            const hasMedia = Boolean(msg.media && msg.media.length > 0);
                            let previewText = '';
                            if (isUser) {
                                if (hasMedia && msg.body) {
                                    previewText = `📷 ${msg.body}`;
                                } else if (hasMedia) {
                                    previewText = '📷 Foto';
                                } else {
                                    previewText = msg.body || 'Pesan';
                                }
                            } else {
                                previewText =
                                    msg.event_title ??
                                    (msg.workflow_event
                                        ? getGigWorkflowEventLabel(msg.workflow_event)
                                        : 'Acara Sistem');
                            }

                            return (
                                <div key={msg.id} className={`flex items-center gap-2 text-xs ${justifyClass}`}>
                                    <div
                                        className={`max-w-[85%] truncate rounded-lg px-2.5 py-1 text-[11px] ${bubbleClass}`}
                                    >
                                        {isAdmin && isUser && msg.sender?.name && (
                                            <span className="font-bold mr-1">{msg.sender.name}:</span>
                                        )}
                                        <span>{previewText}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {isExpanded && (
                <>
                    {/* Chat Body */}
                    <div
                        ref={listRef}
                        onScroll={(event) => {
                            const element = event.currentTarget;
                            nearBottom.current =
                                element.scrollHeight - element.scrollTop - element.clientHeight <
                                80;
                        }}
                        className="flex max-h-[32rem] min-h-[16rem] w-full min-w-0 flex-col gap-3 overflow-x-hidden overflow-y-auto bg-muted/15 p-4 sm:p-6"
                    >
                        {messages.length === 0 && (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                Belum ada pesan.
                            </p>
                        )}
                        {messages.map((message, index) => {
                            const currentDateKey = getDateKey(message.created_at);
                            const prevMessage = index > 0 ? messages[index - 1] : null;
                            const prevDateKey = prevMessage ? getDateKey(prevMessage.created_at) : null;
                            const showDateDivider = currentDateKey !== prevDateKey;

                            let messageElement;

                            if (message.kind === GigMessageKind.System) {
                                const actor = getEventActor(
                                    message.workflow_event,
                                    message.event_snapshot,
                                );
                                const title = getWorkflowEventTitle(
                                    message.event_title,
                                    message.workflow_event,
                                );

                                let systemAlignment = 'mx-auto self-center';
                                let eventTimeAlignment = 'text-center';

                                if (actor === 'client') {
                                    if (isClientViewer) {
                                        systemAlignment = 'self-end';
                                        eventTimeAlignment = 'text-right';
                                    } else {
                                        systemAlignment = 'self-start';
                                        eventTimeAlignment = 'text-left';
                                    }
                                } else if (actor === 'freelancer') {
                                    if (isClientViewer) {
                                        systemAlignment = 'self-start';
                                        eventTimeAlignment = 'text-left';
                                    } else {
                                        systemAlignment = 'self-end';
                                        eventTimeAlignment = 'text-right';
                                    }
                                }

                                // header clickable when event_action exists
                                const HeaderWrapper = message.event_action ? 'a' : 'div';
                                const headerWrapperProps = message.event_action
                                    ? { href: message.event_action.url }
                                    : {};

                                const eventTimeElement = (
                                    <time className="text-[10px] text-muted-foreground select-none shrink-0 pb-0.5">
                                        {formatDate(message.created_at, 'HH:mm')}
                                    </time>
                                );

                                const isRightEvent = systemAlignment === 'self-end';
                                const isLeftEvent = systemAlignment === 'self-start';
                                const isCenterEvent = !isRightEvent && !isLeftEvent;

                                const conciseEntries = Object.entries(message.event_snapshot ?? {}).filter(
                                    ([key, value]) =>
                                        !EXCLUDED_SNAPSHOT_KEYS.has(key) &&
                                        value !== null &&
                                        value !== undefined &&
                                        value !== '',
                                );

                                if (isMobile || isCenterEvent) {
                                    messageElement = (
                                        <div
                                            className={`flex flex-col w-full min-w-0 ${isRightEvent
                                                ? 'items-end'
                                                : isLeftEvent
                                                    ? 'items-start'
                                                    : 'items-center'
                                                }`}
                                        >
                                            <article className="min-w-0 max-w-[85%] overflow-hidden rounded-lg border bg-muted/50 text-xs text-foreground shadow-xs sm:max-w-[380px]">
                                                <HeaderWrapper
                                                    {...headerWrapperProps}
                                                    className={`flex min-w-0 items-center justify-between gap-2 bg-primary/10 px-3 py-2 font-semibold text-primary transition-colors ${message.event_action ? 'cursor-pointer hover:bg-primary/15' : ''}`}
                                                >
                                                    <span className={`min-w-0 flex-1 truncate text-left ${isAdmin || !message.event_action ? 'mr-8' : ''}`}>{title}</span>
                                                    {message.event_action && (
                                                        <div className="flex shrink-0 items-center gap-1">
                                                            {!isMobile && (
                                                                <span className="ml-4 text-[11px] font-medium text-primary/80">
                                                                    {message.event_action.label}
                                                                </span>
                                                            )}
                                                            <ChevronRight className="size-4 shrink-0 opacity-80" />
                                                        </div>
                                                    )}
                                                </HeaderWrapper>

                                                {conciseEntries.length > 0 && (
                                                    <div className="divide-y divide-border/40 border-t border-border/40 bg-card/40">
                                                        {conciseEntries.map(([key, value]) => (
                                                            <div
                                                                key={key}
                                                                className="flex items-center justify-between gap-3 px-3 py-1.5 text-[11px]"
                                                            >
                                                                <span className="shrink-0 font-medium text-muted-foreground">
                                                                    {formatSnapshotKey(key)}
                                                                </span>
                                                                <span className="truncate font-semibold text-foreground/90">
                                                                    {formatSnapshotValue(key, value)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </article>
                                            <div className="mt-1 px-1">
                                                {eventTimeElement}
                                            </div>
                                        </div>
                                    );
                                } else {
                                    messageElement = (
                                        <div
                                            className={`flex w-full min-w-0 items-end gap-2 ${isRightEvent ? 'justify-end' : 'justify-start'
                                                }`}
                                        >
                                            {isRightEvent && eventTimeElement}
                                            <article className="min-w-0 max-w-[85%] overflow-hidden rounded-lg border bg-muted/50 text-xs text-foreground shadow-xs sm:max-w-[380px]">
                                                <HeaderWrapper
                                                    {...headerWrapperProps}
                                                    className={`flex min-w-0 items-center justify-between gap-2 bg-primary/10 px-3 py-2 font-semibold text-primary transition-colors ${message.event_action ? 'cursor-pointer hover:bg-primary/15' : ''}`}
                                                >
                                                    <span className={`min-w-0 flex-1 truncate text-left ${isAdmin || !message.event_action ? 'mr-8' : ''}`}>{title}</span>
                                                    {message.event_action && (
                                                        <div className="flex shrink-0 items-center gap-1">
                                                            <span className="ml-4 text-[11px] font-medium text-primary/80">
                                                                {message.event_action.label}
                                                            </span>
                                                            <ChevronRight className="size-4 shrink-0 opacity-80" />
                                                        </div>
                                                    )}
                                                </HeaderWrapper>

                                                {conciseEntries.length > 0 && (
                                                    <div className="divide-y divide-border/40 border-t border-border/40 bg-card/40">
                                                        {conciseEntries.map(([key, value]) => (
                                                            <div
                                                                key={key}
                                                                className="flex items-center justify-between gap-3 px-3 py-1.5 text-[11px]"
                                                            >
                                                                <span className="shrink-0 font-medium text-muted-foreground">
                                                                    {formatSnapshotKey(key)}
                                                                </span>
                                                                <span className="truncate font-semibold text-foreground/90">
                                                                    {formatSnapshotValue(key, value)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </article>
                                            {isLeftEvent && eventTimeElement}
                                        </div>
                                    );
                                }
                            } else {
                                const isOwn = currentUserId !== undefined && message.sender?.id === currentUserId;
                                const isRightAligned = isAdmin
                                    ? conversation.participants.length > 1 && message.sender?.id === conversation.participants[1]?.id
                                    : isOwn;

                                const timeElement = (
                                    <time className="text-[10px] text-muted-foreground select-none shrink-0 pb-0.5">
                                        {formatDate(message.created_at, 'HH:mm')}
                                    </time>
                                );

                                const mediaCount = message.media.length;
                                const mediaGrid = mediaCount > 0 ? (
                                    <PhotoProvider>
                                        <div
                                            className={`mb-1.5 grid w-fit max-w-full gap-1.5 ${getMediaGridClass(mediaCount)}`}
                                        >
                                            {message.media.map((media: { id: number; url: string }, index: number) => (
                                                <PhotoView key={media.id} src={media.url}>
                                                    <div className={`${getMediaItemClass(mediaCount, index)} cursor-pointer`}>
                                                        <img
                                                            src={media.url}
                                                            alt="Lampiran percakapan"
                                                            className="aspect-square w-full rounded-xl border border-border/40 object-cover shadow-2xs transition-opacity hover:opacity-90"
                                                        />
                                                    </div>
                                                </PhotoView>
                                            ))}
                                        </div>
                                    </PhotoProvider>
                                ) : null;

                                if (isMobile) {
                                    messageElement = (
                                        <div
                                            className={`flex flex-col w-full min-w-0 ${isRightAligned ? 'items-end' : 'items-start'
                                                }`}
                                        >
                                            {mediaGrid}
                                            {message.body && (
                                                <article
                                                    className={`w-fit min-w-[3.5rem] max-w-[85%] rounded-2xl px-3.5 py-2 shadow-xs transition-colors ${isRightAligned
                                                        ? 'bg-primary text-primary-foreground rounded-br-xs'
                                                        : 'bg-card border border-border/60 text-foreground rounded-bl-xs'
                                                        }`}
                                                >
                                                    {isAdmin && message.sender?.name && (
                                                        <p
                                                            className={`text-xs font-bold ${isRightAligned ? 'text-primary-foreground/90' : 'text-foreground'
                                                                }`}
                                                        >
                                                            {message.sender.name}
                                                        </p>
                                                    )}
                                                    <p
                                                        className={`text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${isRightAligned ? 'text-primary-foreground' : 'text-foreground'
                                                            }`}
                                                    >
                                                        {message.body}
                                                    </p>
                                                </article>
                                            )}
                                            <div className="mt-1 px-1">
                                                {timeElement}
                                            </div>
                                        </div>
                                    );
                                } else {
                                    const avatarElement = message.sender ? (
                                        <UserAvatar
                                            user={{
                                                name: message.sender.name,
                                                avatar_url: message.sender.avatar_url ?? undefined,
                                            }}
                                            size="sm"
                                            className="size-7 shrink-0 select-none mb-0.5"
                                        />
                                    ) : null;

                                    // approach:
                                    // - media only: image group w-fit + side time
                                    // - media + body: separate stacks, image standalone, bubble row (bubble w-fit + time)
                                    //   -> image width no effect on bubble width
                                    if (mediaCount > 0 && message.body) {
                                        messageElement = (
                                            <div
                                                className={`flex w-full min-w-0 flex-col gap-2 ${isRightAligned ? 'items-end' : 'items-start'}`}
                                            >
                                                {/* image block alone */}
                                                <div
                                                    className={`flex w-full items-end gap-2 ${isRightAligned ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    {!isRightAligned && avatarElement}
                                                    <div
                                                        className={`flex w-fit max-w-[75%] flex-col ${isRightAligned ? 'items-end' : 'items-start'}`}
                                                    >
                                                        {mediaGrid}
                                                    </div>
                                                    {isRightAligned && (
                                                        <div className="size-7 shrink-0" aria-hidden />
                                                    )}
                                                </div>

                                                {/* bubble + time grouped */}
                                                <div
                                                    className={`flex w-full min-w-0 items-end gap-2 ${isRightAligned ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    {!isRightAligned && (
                                                        <div className="size-7 shrink-0" aria-hidden />
                                                    )}
                                                    {isRightAligned && timeElement}
                                                    <article
                                                        className={`w-fit min-w-[3.5rem] max-w-[75%] rounded-2xl px-3.5 py-2 shadow-xs transition-colors ${isRightAligned
                                                            ? 'bg-primary text-primary-foreground rounded-br-xs'
                                                            : 'bg-card border border-border/60 text-foreground rounded-bl-xs'
                                                            }`}
                                                    >
                                                        {isAdmin && message.sender?.name && (
                                                            <p
                                                                className={`text-xs font-bold ${isRightAligned ? 'text-primary-foreground/90' : 'text-foreground'}`}
                                                            >
                                                                {message.sender.name}
                                                            </p>
                                                        )}
                                                        <p
                                                            className={`text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${isRightAligned ? 'text-primary-foreground' : 'text-foreground'}`}
                                                        >
                                                            {message.body}
                                                        </p>
                                                    </article>
                                                    {!isRightAligned && timeElement}
                                                    {isRightAligned && avatarElement}
                                                </div>
                                            </div>
                                        );
                                    } else if (mediaCount > 0) {
                                        // image only - current implementation side time
                                        messageElement = (
                                            <div
                                                className={`flex w-full min-w-0 items-end gap-2 ${isRightAligned ? 'justify-end' : 'justify-start'}`}
                                            >
                                                {!isRightAligned && avatarElement}
                                                {isRightAligned && timeElement}
                                                <div
                                                    className={`flex w-fit min-w-[3.5rem] max-w-[75%] flex-col ${isRightAligned ? 'items-end' : 'items-start'}`}
                                                >
                                                    {mediaGrid}
                                                </div>
                                                {!isRightAligned && timeElement}
                                                {isRightAligned && avatarElement}
                                            </div>
                                        );
                                    } else {
                                        // text only: time beside bubble (close gap via w-fit)
                                        messageElement = (
                                            <div
                                                className={`flex w-full min-w-0 items-end gap-2 ${isRightAligned ? 'justify-end' : 'justify-start'
                                                    }`}
                                            >
                                                {!isRightAligned && avatarElement}
                                                {isRightAligned && timeElement}
                                                <article
                                                    className={`w-fit min-w-[3.5rem] max-w-[75%] rounded-2xl px-3.5 py-2 shadow-xs transition-colors ${isRightAligned
                                                        ? 'bg-primary text-primary-foreground rounded-br-xs'
                                                        : 'bg-card border border-border/60 text-foreground rounded-bl-xs'
                                                        }`}
                                                >
                                                    {isAdmin && message.sender?.name && (
                                                        <p
                                                            className={`text-xs font-bold ${isRightAligned ? 'text-primary-foreground/90' : 'text-foreground'
                                                                }`}
                                                        >
                                                            {message.sender.name}
                                                        </p>
                                                    )}
                                                    <p
                                                        className={`text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${isRightAligned ? 'text-primary-foreground' : 'text-foreground'
                                                            }`}
                                                    >
                                                        {message.body}
                                                    </p>
                                                </article>
                                                {!isRightAligned && timeElement}
                                                {isRightAligned && avatarElement}
                                            </div>
                                        );
                                    }
                                }
                            }

                            return (
                                <Fragment key={message.id}>
                                    {showDateDivider && (
                                        <div className="my-2 flex w-full items-center justify-center self-stretch">
                                            <span className="rounded-full border border-border/40 bg-card/80 px-3 py-0.5 text-[11px] font-medium text-muted-foreground shadow-2xs select-none backdrop-blur-xs">
                                                {formatDateDivider(message.created_at)}
                                            </span>
                                        </div>
                                    )}
                                    {messageElement}
                                </Fragment>
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
                            className="flex flex-col gap-1 border-t border-border/60 bg-card px-1 pt-1.5"
                            onSubmit={(event) => {
                                event.preventDefault();
                                form.post(store.url(conversation.agreement_id), {
                                    forceFormData: true,
                                    preserveScroll: true,
                                    onSuccess: () => {
                                        form.reset();
                                    },
                                });
                            }}
                        >
                            <ImagePickerPreviewList
                                items={imageItems}
                                onRemove={removeImage}
                                disabled={form.processing || isImageSelectionProcessing}
                                variant='compact'
                            />
                            <div className="px-2 pb-3  flex flex-col gap-2">
                                {imageError && (
                                    <p className="text-xs text-destructive" aria-live="polite">
                                        {imageError}
                                    </p>
                                )}
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => inputRef.current?.click()}
                                        disabled={isImageSelectionDisabled}
                                        title="Lampirkan foto"
                                    >
                                        <Paperclip data-icon="inline-start" />
                                    </Button>
                                    <input
                                        ref={inputRef}
                                        type="file"
                                        accept={imageAccept}
                                        multiple
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                    <Input
                                        maxLength={2000}
                                        placeholder="Tulis pesan..."
                                        value={form.data.body}
                                        onChange={(event) => form.setData('body', event.target.value)}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' && !event.shiftKey) {
                                                event.preventDefault();
                                                if (form.data.body.trim() || form.data.images.length > 0) {
                                                    form.post(store.url(conversation.agreement_id), {
                                                        forceFormData: true,
                                                        preserveScroll: true,
                                                        onSuccess: () => {
                                                            form.reset();
                                                        },
                                                    });
                                                }
                                            }
                                        }}
                                        className="flex-1 text-xs sm:text-sm"
                                    />
                                    <Button
                                        type="submit"
                                        size="icon"
                                        disabled={form.processing || (!form.data.body.trim() && form.data.images.length === 0)}
                                        title="Kirim pesan"
                                    >
                                        <SendHorizontal className="size-4" />
                                    </Button>
                                </div>
                                {form.errors.body && (
                                    <p className="text-xs text-destructive">{form.errors.body}</p>
                                )}
                            </div>
                        </form>
                    )}
                </>
            )}
        </AppPageCard>
    );
}
