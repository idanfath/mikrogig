import { Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    MessageCircle,
    Paperclip,
    SendHorizontal,
} from 'lucide-react';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { formatDate, formatDateDivider } from '@/lib/date';
import { cn, sentenceCase, toInertiaHref } from '@/lib/utils';
import {
    destination,
    show,
} from '@/routes/app/gig_conversations';
import type { Auth } from '@/types/auth';
import {
    GigMessageKind,
    GigWorkflowEvent,
    getGigDisputeFindingLabel,
    getGigDisputeTypeLabel,
    getGigSettlementOutcomeLabel,
    getGigWorkflowEventLabel,
} from '@/types/enum';
import type {
    ConversationMessage,
    GigConversation as GigConversationData,
} from '../conversation-types';
import { useGigConversationRealtime } from '../hooks/use-gig-conversation-realtime';

function getDateKey(dateString: string): string {
    try {
        const date = new Date(dateString);

        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    } catch {
        return dateString;
    }
}

const MESSAGE_GROUP_WINDOW_MS = 5 * 60 * 1000;

function isGroupedMessage(
    previous: ConversationMessage,
    current: ConversationMessage,
): boolean {
    if (
        previous.kind !== GigMessageKind.User
        || current.kind !== GigMessageKind.User
        || previous.sender?.id !== current.sender?.id
        || getDateKey(previous.created_at) !== getDateKey(current.created_at)
    ) {
        return false;
    }

    const previousTime = new Date(previous.created_at).getTime();
    const currentTime = new Date(current.created_at).getTime();
    const gap = currentTime - previousTime;

    return Number.isFinite(gap) && gap >= 0 && gap <= MESSAGE_GROUP_WINDOW_MS;
}

function isMessageGroupTail(messages: ConversationMessage[], index: number): boolean {
    const current = messages[index];
    const next = messages[index + 1];

    return current === undefined || next === undefined || !isGroupedMessage(current, next);
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

    if (key === 'finding') {
        return getGigDisputeFindingLabel(strVal);
    }

    if (key === 'outcome') {
        return getGigSettlementOutcomeLabel(strVal);
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
    mode?: 'inline' | 'page';
    focusRequest?: {
        messageId: number;
        sequence: number;
    } | null;
    onFocusCleared?: () => void;
};

const CHAT_EXPANDED_STORAGE_KEY = 'gig_chat_is_expanded';
const OPEN_CONVERSATION_DATA_ATTRIBUTE = 'gigConversationAgreementId';

export function GigConversation({
    conversation,
    defaultExpanded,
    mode,
    focusRequest,
    onFocusCleared,
}: Props) {
    return (
        <GigConversationContent
            key={[
                conversation?.agreement_id ?? 'empty',
                conversation?.mode ?? 'empty',
                conversation?.focused_message_id ?? 'none',
            ].join(':')}
            conversation={conversation}
            defaultExpanded={defaultExpanded}
            mode={mode}
            focusRequest={focusRequest}
            onFocusCleared={onFocusCleared}
        />
    );
}

function GigConversationContent({
    conversation,
    defaultExpanded = true,
    mode = 'inline',
    focusRequest = null,
    onFocusCleared,
}: Props) {
    const isPage = mode === 'page';
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
    const currentUserName = auth?.user?.name;
    const viewerRole = auth?.user?.role;
    const isAdmin = viewerRole === 'admin';
    const isClientViewer = viewerRole === 'client';
    const [olderMessages, setOlderMessages] = useState<ConversationMessage[]>([]);
    const [hasOlder, setHasOlder] = useState(conversation?.has_older ?? false);
    const [oldestId, setOldestId] = useState<number | null>(conversation?.oldest_id ?? null);
    const [isLoadingOlder, setIsLoadingOlder] = useState(false);
    const [isConversationVisible, setIsConversationVisible] = useState(false);
    const [highlightedMessageId, setHighlightedMessageId] = useState<number | null>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const nearBottom = useRef(true);
    const markedReadKey = useRef('');
    const handledFocusSequence = useRef<number | null>(null);
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
    const isConversationExpanded = isPage || (!isMobile && isExpanded);

    const expandConversation = useCallback(() => {
        if (isPage || isMobile) {
            return;
        }

        setIsExpanded(true);

        try {
            localStorage.setItem(CHAT_EXPANDED_STORAGE_KEY, 'true');
        } catch {
            // fallback if localStorage is unavailable
        }
    }, [isMobile, isPage]);

    const focusMessage = useCallback((messageId: number) => {
        expandConversation();
        setHighlightedMessageId(messageId);

        window.setTimeout(() => {
            document.getElementById('conversation')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
            document.getElementById(`conversation-message-${messageId}`)?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        });

        window.setTimeout(() => {
            setHighlightedMessageId((current) => current === messageId ? null : current);
        }, 2500);
    }, [expandConversation]);

    const mergeMessage = useCallback((message: ConversationMessage) => {
        setOlderMessages((current) => {
            if (current.some(({ id }) => id === message.id)) {
                return current;
            }

            return [...current, message];
        });
    }, []);

    const refreshConversation = useCallback(() => {
        router.reload({
            only: ['conversation'],
        });
    }, []);

    const {
        onlineParticipantIds,
        typingParticipant,
        notifyTyping,
        clearTyping,
    } = useGigConversationRealtime({
        agreementId: conversation?.agreement_id ?? null,
        currentUserId,
        currentUserName,
        canViewConversation: conversation?.capabilities.canViewConversation,
        onMessage: mergeMessage,
        onSystemMessage: refreshConversation,
        onReconnect: refreshConversation,
    });

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
        if (
            focusRequest === null
            || handledFocusSequence.current === focusRequest.sequence
            || conversation === null
        ) {
            return;
        }

        handledFocusSequence.current = focusRequest.sequence;

        const timeout = window.setTimeout(() => {
            expandConversation();

            if (messages.some(({ id }) => id === focusRequest.messageId)) {
                focusMessage(focusRequest.messageId);

                return;
            }

            router.reload({
                data: { chat_focus: focusRequest.messageId },
                only: ['conversation'],
                preserveUrl: true,
            });
        });

        return () => window.clearTimeout(timeout);
    }, [conversation, expandConversation, focusMessage, focusRequest, messages]);

    useEffect(() => {
        if (nearBottom.current) {
            listRef.current?.scrollTo({
                top: listRef.current.scrollHeight,
            });
        }
    }, [messages.length]);

    useEffect(() => {
        const focusedConversation = conversation;
        const focusedMessageId = focusedConversation?.focused_message_id;

        if (
            focusedConversation === null ||
            focusedConversation.mode !== 'focused' ||
            typeof focusedMessageId !== 'number'
        ) {
            return;
        }

        const timeout = window.setTimeout(() => {
            setOlderMessages([]);
            setHasOlder(focusedConversation.has_older);
            setOldestId(focusedConversation.oldest_id);
            focusMessage(focusedMessageId);
        });

        return () => {
            window.clearTimeout(timeout);
        };
    }, [conversation, focusMessage]);

    const unreadKey = useMemo(
        () =>
            messages
                .filter((message) => message.recipient_id !== null && !message.read_at)
                .filter((message) => message.recipient_id === currentUserId)
                .map((message) => message.id)
                .join(','),
        [currentUserId, messages],
    );
    const recentMessages = useMemo(() => messages.slice(-5), [messages]);
    const shouldMarkRead = Boolean(
        conversation?.capabilities.canMarkRead
        && isConversationExpanded
        && isConversationVisible,
    );

    useEffect(() => {
        if (
            !conversation ||
            !shouldMarkRead ||
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
    }, [conversation, shouldMarkRead, unreadKey]);

    const loadOlder = useCallback(() => {
        if (
            !conversation
            || conversation.mode !== 'latest'
            || !hasOlder
            || oldestId === null
            || isLoadingOlder
        ) {
            return;
        }

        const element = listRef.current;
        const previousHeight = element?.scrollHeight ?? 0;
        const previousTop = element?.scrollTop ?? 0;
        setIsLoadingOlder(true);

        router.reload({
            data: { chat_before: oldestId },
            only: ['conversation'],
            onSuccess: (page) => {
                const batch = page.props.conversation as GigConversationData;
                setOlderMessages((current) => {
                    const merged = new Map(current.map((message) => [message.id, message]));
                    batch.messages.forEach((message) => merged.set(message.id, message));

                    return [...merged.values()].sort((left, right) => left.id - right.id);
                });
                setHasOlder(batch.has_older);
                setOldestId(batch.oldest_id);
                window.history.replaceState({}, '', window.location.pathname);
                requestAnimationFrame(() => {
                    if (element) {
                        element.scrollTop = previousTop + element.scrollHeight - previousHeight;
                    }
                });
            },
            onFinish: () => setIsLoadingOlder(false),
        });
    }, [conversation, hasOlder, isLoadingOlder, oldestId]);

    useEffect(() => {
        if (!conversation?.capabilities.canViewConversation) {
            return;
        }

        const agreementId = String(conversation.agreement_id);
        const element = document.getElementById('conversation');

        if (element === null) {
            return;
        }

        const observer = new IntersectionObserver(([entry]) => {
            const isVisible = entry?.isIntersecting ?? false;
            setIsConversationVisible(isVisible);

            if (isVisible) {
                document.documentElement.dataset[OPEN_CONVERSATION_DATA_ATTRIBUTE] = agreementId;

                return;
            }

            if (document.documentElement.dataset[OPEN_CONVERSATION_DATA_ATTRIBUTE] === agreementId) {
                delete document.documentElement.dataset[OPEN_CONVERSATION_DATA_ATTRIBUTE];
            }
        }, { threshold: 0.01 });

        observer.observe(element);

        return () => {
            observer.disconnect();
            setIsConversationVisible(false);

            if (document.documentElement.dataset[OPEN_CONVERSATION_DATA_ATTRIBUTE] === agreementId) {
                delete document.documentElement.dataset[OPEN_CONVERSATION_DATA_ATTRIBUTE];
            }
        };
    }, [conversation?.agreement_id, conversation?.capabilities.canViewConversation]);

    if (!conversation?.capabilities.canViewConversation) {
        return null;
    }

    const ConversationContainer = isPage ? 'main' : AppPageCard;

    const leftPerson = isClientViewer
        ? conversation.participants[1] ?? conversation.participants[0]
        : conversation.participants[0];

    const rightPerson = isClientViewer
        ? conversation.participants[0]
        : conversation.participants[1] ?? conversation.participants[0];
    const isCounterpartOnline = conversation.participants.some(
        (participant) => participant.id !== currentUserId && onlineParticipantIds.has(participant.id),
    );
    const submitMessage = () => {
        clearTyping();
        form.post(store.url(conversation.agreement_id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
            },
        });
    };

    return (
        <ConversationContainer
            id="conversation"
            className={cn(
                'flex flex-col overflow-hidden',
                isPage ? 'h-dvh min-h-dvh bg-background' : 'p-0',
            )}
        >
            <div className="flex shrink-0 flex-col gap-1.5 border-b border-border/60 bg-card px-4 py-3 sm:px-6 sm:py-4">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                        {isPage && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Kembali"
                                onClick={() => {
                                    if (window.history.length > 1) {
                                        window.history.back();
                                    } else {
                                        router.get(destination(conversation.agreement_id));
                                    }
                                }}
                            >
                                <ChevronLeft data-icon="inline-start" />
                            </Button>
                        )}
                        <h2 className="truncate text-sm font-bold text-foreground sm:text-base">
                            Percakapan Gig
                        </h2>
                    </div>

                    <div className="flex items-center gap-2">
                        {!isPage && (
                            isMobile ? (
                                <Button asChild variant="outline" size="xs" className="gap-1.5">
                                    <Link href={show(conversation.agreement_id)}>
                                        <MessageCircle data-icon="inline-start" />
                                        Buka chat
                                    </Link>
                                </Button>
                            ) : (
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
                                        className={cn(
                                            'size-4 transition-transform duration-200',
                                            isExpanded && 'rotate-180',
                                        )}
                                    />
                                </Button>
                            )
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground font-medium">
                    <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1.5">
                            {!isAdmin && (
                                <span
                                    className={cn(
                                        'size-2 rounded-full',
                                        isCounterpartOnline ? 'bg-emerald-500' : 'bg-muted-foreground/40',
                                    )}
                                    aria-label={isCounterpartOnline ? 'Peserta lain online' : 'Peserta lain offline'}
                                />
                            )}
                            {leftPerson?.name}
                        </span>
                        {typingParticipant && conversation.capabilities.canSendMessage && (
                            <span className="shimmer shimmer-duration-2000 text-[11px] text-muted-foreground">
                                Mengetik...
                            </span>
                        )}
                    </div>
                    <span>{rightPerson?.name}</span>
                </div>

                {!isConversationExpanded && recentMessages.length > 0 && (
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

            {isConversationExpanded && (
                <>
                    <div
                        ref={listRef}
                        onScroll={(event) => {
                            const element = event.currentTarget;
                            nearBottom.current =
                                element.scrollHeight - element.scrollTop - element.clientHeight <
                                80;

                            if (element.scrollTop < 96) {
                                loadOlder();
                            }
                        }}
                        className={cn(
                            'flex w-full min-w-0 flex-col gap-3 overflow-x-hidden overflow-y-auto bg-muted/15 p-4 sm:p-6',
                            isPage ? 'min-h-0 flex-1' : 'max-h-[32rem] min-h-[16rem]',
                        )}
                    >
                        {conversation.mode === 'focused' && (
                            <div className="sticky top-0 z-10 flex justify-center border-b border-border/45 bg-background/90 p-2 backdrop-blur-sm">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="xs"
                                    onClick={() => {
                                        onFocusCleared?.();
                                        router.reload({
                                            data: { chat_focus: null },
                                            only: ['conversation'],
                                            preserveUrl: true,
                                        });
                                    }}
                                >
                                    Kembali ke pesan terbaru
                                </Button>
                            </div>
                        )}
                        {isLoadingOlder && (
                            <p className="py-1 text-center text-xs text-muted-foreground">
                                Memuat pesan sebelumnya...
                            </p>
                        )}
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
                            const isGroupedWithPrevious = prevMessage !== null && isGroupedMessage(prevMessage, message);
                            const isGroupTail = isMessageGroupTail(messages, index);

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

                                const HeaderWrapper = message.event_action ? Link : 'div';
                                const headerWrapperProps = message.event_action
                                    ? { href: toInertiaHref(message.event_action.url) }
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

                                const timeElement = isGroupTail ? (
                                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground select-none shrink-0 pb-0.5">
                                        <time>{formatDate(message.created_at, 'HH:mm')}</time>
                                        {isOwn && message.recipient_id !== null && (
                                            <span>{message.read_at ? 'Dibaca' : 'Terkirim'}</span>
                                        )}
                                    </span>
                                ) : null;

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
                                            {timeElement && (
                                                <div className="mt-1 px-1">
                                                    {timeElement}
                                                </div>
                                            )}
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

                            const isFocused = message.id === highlightedMessageId;

                            return (
                                <div
                                    id={`conversation-message-${message.id}`}
                                    key={message.id}
                                    className={cn(
                                        isFocused && [
                                            '[&_article]:ring-2 [&_article]:ring-primary/35 [&_article]:ring-offset-2 [&_article]:ring-offset-muted/15 [&_article]:shadow-md',
                                            '[&_img]:ring-2 [&_img]:ring-primary/35 [&_img]:ring-offset-2 [&_img]:ring-offset-muted/15',
                                        ],
                                    )}
                                >
                                    {showDateDivider && (
                                        <div className="my-2 flex w-full items-center justify-center self-stretch">
                                            <span className="rounded-full border border-border/40 bg-card/80 px-3 py-0.5 text-[11px] font-medium text-muted-foreground shadow-2xs select-none backdrop-blur-xs">
                                                {formatDateDivider(message.created_at)}
                                            </span>
                                        </div>
                                    )}
                                    {isGroupedWithPrevious ? (
                                        <div className="-mt-2">{messageElement}</div>
                                    ) : messageElement}
                                </div>
                            );
                        })}
                    </div>

                    {conversation.capabilities.isReadOnly && (
                        <div className={cn(
                            'border-t border-border/60 bg-muted/40 p-4 text-center text-xs text-muted-foreground',
                            isPage && 'shrink-0',
                        )}>
                            Percakapan ini telah ditutup dan hanya dapat dibaca.
                        </div>
                    )}

                    {conversation.capabilities.canSendMessage && (
                        <form
                            className={cn(
                                'flex flex-col gap-1 border-t border-border/60 bg-card px-1 pt-1.5',
                                isPage && 'shrink-0 pb-[env(safe-area-inset-bottom)]',
                            )}
                            onSubmit={(event) => {
                                event.preventDefault();
                                submitMessage();
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
                                        onChange={(event) => {
                                            form.setData('body', event.target.value);

                                            if (event.target.value.trim()) {
                                                notifyTyping();
                                            }
                                        }}
                                        onBlur={clearTyping}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' && !event.shiftKey) {
                                                event.preventDefault();

                                                if (form.data.body.trim() || form.data.images.length > 0) {
                                                    submitMessage();
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
        </ConversationContainer>
    );
}
