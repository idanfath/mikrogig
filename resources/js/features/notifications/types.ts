export type InboxMessage = {
  id: number;
  title: string;
  body: string | null;
  action_url: string | null;
  action_label: string | null;
  created_at: string;
  read_at: string | null;
};

export type NotificationReceivedEvent = {
  id: number;
  title: string;
  body?: string | null;
  action_url?: string | null;
  action_label?: string | null;
};

export type PaginatedInbox = {
  data: InboxMessage[];
  current_page: number;
  last_page: number;
  prev_page_url: string | null;
  next_page_url: string | null;
  total: number;
};

export type AuthProps = {
  user?: { id: number } | null;
  unread_notifications_count?: number;
};

export type NotificationPageProps = {
  inbox: PaginatedInbox;
  filters?: {
    search?: string | null;
  };
  auth?: AuthProps;
};

export function asNotificationPageProps(props: unknown): NotificationPageProps {
  return props as NotificationPageProps;
}
