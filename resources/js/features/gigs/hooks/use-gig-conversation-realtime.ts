import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ConversationMessage,
  ConversationPerson,
} from '../conversation-types';

type MessageCreatedEvent = {
  kind: 'user' | 'system';
  message?: ConversationMessage;
  message_id: number;
};

type TypingEvent = {
  id: number;
  name: string;
  is_typing?: boolean;
};

type MessagesReadEvent = {
  reader_id: number;
};

type Options = {
  agreementId: number | null;
  currentUserId: number | undefined;
  currentUserName: string | undefined;
  canViewConversation: boolean | undefined;
  onMessage: (message: ConversationMessage) => void;
  onSystemMessage: () => void;
  onReconnect: () => void;
};

const TYPING_THROTTLE_MS = 1000;
const TYPING_TIMEOUT_MS = 2500;

export function useGigConversationRealtime({
  agreementId,
  currentUserId,
  currentUserName,
  canViewConversation,
  onMessage,
  onSystemMessage,
  onReconnect,
}: Options) {
  const [onlineParticipants, setOnlineParticipants] = useState<
    ConversationPerson[]
  >([]);
  const [typingParticipant, setTypingParticipant] =
    useState<ConversationPerson | null>(null);
  const channelRef = useRef<ReturnType<typeof window.Echo.join> | null>(null);
  const lastTypingAt = useRef(0);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didConnect = useRef(false);
  const callbacks = useRef({ onMessage, onSystemMessage, onReconnect });

  useEffect(() => {
    callbacks.current = { onMessage, onSystemMessage, onReconnect };
  }, [onMessage, onReconnect, onSystemMessage]);

  const clearTypingParticipant = useCallback(() => {
    if (typingTimeout.current !== null) {
      clearTimeout(typingTimeout.current);
      typingTimeout.current = null;
    }

    setTypingParticipant(null);
  }, []);

  const whisperTyping = useCallback(
    (isTyping: boolean) => {
      if (!channelRef.current || !currentUserId) {
        return;
      }

      const now = Date.now();

      if (isTyping && now - lastTypingAt.current < TYPING_THROTTLE_MS) {
        return;
      }

      lastTypingAt.current = now;
      channelRef.current.whisper('typing', {
        id: currentUserId,
        name: currentUserName ?? '',
        is_typing: isTyping,
      });
    },
    [currentUserId, currentUserName],
  );

  useEffect(() => {
    if (!agreementId || !canViewConversation || !window.Echo) {
      return;
    }

    const channelName = `gig-conversations.${agreementId}`;
    const channel = window.Echo
      .join(channelName)
      .here((participants: ConversationPerson[]) => {
        setOnlineParticipants(participants);
      })
      .joining((participant: ConversationPerson) => {
        setOnlineParticipants((current) =>
          current.some(({ id }) => id === participant.id)
            ? current
            : [...current, participant],
        );
      })
      .leaving((participant: ConversationPerson) => {
        setOnlineParticipants((current) =>
          current.filter(({ id }) => id !== participant.id),
        );
      })
      .listen('.gig.message.created', (event: MessageCreatedEvent) => {
        if (event.kind === 'system') {
          callbacks.current.onSystemMessage();

          return;
        }

        if (event.message) {
          callbacks.current.onMessage(event.message);
        }
      })
      .listen('.gig.messages.read', (event: MessagesReadEvent) => {
        if (event.reader_id !== currentUserId) {
          callbacks.current.onSystemMessage();
        }
      })
      .listenForWhisper('typing', (event: TypingEvent) => {
        if (!event.id || event.id === currentUserId || !event.is_typing) {
          clearTypingParticipant();

          return;
        }

        setTypingParticipant({ id: event.id, name: event.name, avatar_url: null });

        if (typingTimeout.current !== null) {
          clearTimeout(typingTimeout.current);
        }

        typingTimeout.current = setTimeout(clearTypingParticipant, TYPING_TIMEOUT_MS);
      });

    const onConnected = () => {
      if (didConnect.current) {
        callbacks.current.onReconnect();
      }

      didConnect.current = true;
    };

    window.Echo.connector.pusher.connection.bind('connected', onConnected);
    channelRef.current = channel;

    return () => {
      whisperTyping(false);
      clearTypingParticipant();
      channelRef.current = null;
      window.Echo.connector.pusher.connection.unbind('connected', onConnected);
      window.Echo.leave(channelName);
      setOnlineParticipants([]);
    };
  }, [
    agreementId,
    canViewConversation,
    clearTypingParticipant,
    currentUserId,
    whisperTyping,
  ]);

  return {
    onlineParticipantIds: new Set(onlineParticipants.map(({ id }) => id)),
    typingParticipant,
    notifyTyping: () => whisperTyping(true),
    clearTyping: () => whisperTyping(false),
  };
}
