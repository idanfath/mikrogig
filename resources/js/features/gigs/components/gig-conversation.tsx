import { router, useForm, usePoll } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  markRead,
  store,
} from '@/actions/App/Http/Controllers/GigConversationController';
import { AppPageCard } from '@/components/layout/app-page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { GigMessageKind } from '@/types/enum';
import type {
  ConversationMessage,
  GigConversation as GigConversationData,
} from '../conversation-types';

type Props = {
  conversation: GigConversationData | null;
};

export function GigConversation({ conversation }: Props) {
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

  return (
    <AppPageCard id="conversation" className="flex flex-col gap-4">
      <div>
        <h2 className="font-semibold">Percakapan gig</h2>
        <p className="text-sm text-muted-foreground">
          {conversation.participants.map((person) => person.name).join(' dan ')}
        </p>
      </div>

      {conversation.has_older && (
        <Button
          type="button"
          variant="outline"
          className="self-center"
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

      <div
        ref={listRef}
        onScroll={(event) => {
          const element = event.currentTarget;
          nearBottom.current =
            element.scrollHeight - element.scrollTop - element.clientHeight <
            80;
        }}
        className="flex max-h-[34rem] flex-col gap-3 overflow-y-auto rounded-md border p-3"
      >
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Belum ada pesan.
          </p>
        )}
        {messages.map((message) =>
          message.kind === GigMessageKind.System ? (
            <article
              key={message.id}
              className="rounded-md border bg-muted/50 p-3 text-sm"
            >
              <p className="font-medium">{message.event_title}</p>
              {message.event_snapshot &&
                Object.entries(message.event_snapshot).map(([key, value]) => (
                  <p key={key} className="text-xs text-muted-foreground">
                    {key.replaceAll('_', ' ')}: {String(value ?? '-')}
                  </p>
                ))}
              <time className="text-xs text-muted-foreground">
                {new Date(message.created_at).toLocaleString('id-ID')}
              </time>
              {message.event_action && (
                <a
                  href={message.event_action.url}
                  className="mt-2 block text-xs font-medium text-primary underline"
                >
                  {message.event_action.label}
                </a>
              )}
            </article>
          ) : (
            <article
              key={message.id}
              className="max-w-[88%] rounded-md border p-3"
            >
              <p className="text-xs font-medium">{message.sender?.name}</p>
              {message.body && (
                <p className="text-sm whitespace-pre-wrap">{message.body}</p>
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
                        className="aspect-square w-full rounded object-cover"
                      />
                    </a>
                  ))}
                </div>
              )}
              <time className="text-xs text-muted-foreground">
                {new Date(message.created_at).toLocaleString('id-ID')}
              </time>
            </article>
          ),
        )}
      </div>

      {conversation.capabilities.isReadOnly && (
        <p className="rounded-md bg-muted p-3 text-sm">
          Percakapan ini telah ditutup dan hanya dapat dibaca.
        </p>
      )}

      {conversation.capabilities.canSendMessage && (
        <form
          className="flex flex-col gap-3"
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
            placeholder="Tulis pesan"
            value={form.data.body}
            onChange={(event) => form.setData('body', event.target.value)}
          />
          {form.errors.body && (
            <p className="text-sm text-destructive">{form.errors.body}</p>
          )}
          <Input
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={(event) =>
              selectImages(Array.from(event.target.files ?? []).slice(0, 5))
            }
          />
          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {previews.map((preview, index) => (
                <div key={preview} className="flex flex-col gap-1">
                  <img
                    src={preview}
                    alt={`Pratinjau ${index + 1}`}
                    className="aspect-square rounded object-cover"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const next = form.data.images.filter(
                        (_, imageIndex) => imageIndex !== index,
                      );
                      selectImages(next);
                    }}
                  >
                    Hapus
                  </Button>
                </div>
              ))}
            </div>
          )}
          {form.errors.images && (
            <p className="text-sm text-destructive">{form.errors.images}</p>
          )}
          {form.progress && (
            <p className="text-sm text-muted-foreground">
              Mengunggah {form.progress.percentage}%
            </p>
          )}
          <Button type="submit" disabled={form.processing}>
            {form.processing ? 'Mengirim...' : 'Kirim pesan'}
          </Button>
        </form>
      )}
    </AppPageCard>
  );
}
