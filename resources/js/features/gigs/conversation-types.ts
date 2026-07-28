import type { GigMessageKind, GigWorkflowEvent } from '@/types/enum';

export type ConversationPerson = {
  id: number;
  name: string;
  avatar_url: string | null;
};

export type ConversationMessage = {
  id: number;
  kind: GigMessageKind;
  body: string | null;
  workflow_event: GigWorkflowEvent | null;
  event_snapshot: Record<string, unknown> | null;
  event_title: string | null;
  event_action: { url: string; label: string } | null;
  sender: ConversationPerson | null;
  recipient_id: number | null;
  read_at: string | null;
  created_at: string;
  media: Array<{
    id: number;
    mime_type: string;
    url: string;
  }>;
};

export type GigConversation = {
  agreement_id: number;
  participants: ConversationPerson[];
  messages: ConversationMessage[];
  mode: 'latest' | 'focused';
  has_older: boolean;
  oldest_id: number | null;
  focused_message_id: number | null;
  has_newer: boolean;
  newest_id: number | null;
  capabilities: {
    canViewConversation: boolean;
    canSendMessage: boolean;
    canViewMedia: boolean;
    canMarkRead: boolean;
    isReadOnly: boolean;
  };
};
