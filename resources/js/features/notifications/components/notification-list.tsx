import { InfiniteScroll } from '@inertiajs/react';
import type { InboxMessage, PaginatedInbox } from '../types';
import { NotificationEmpty } from './notification-empty';
import { NotificationItem } from './notification-item';

type NotificationListProps = {
  inbox: PaginatedInbox;
  isCompact: boolean;
  isDesktop: boolean;
  hasSearch: boolean;
  onOpen: (message: InboxMessage) => void;
  onDelete: (id: number) => void;
};

export function NotificationList({
  inbox,
  isCompact,
  isDesktop,
  hasSearch,
  onOpen,
  onDelete,
}: NotificationListProps) {
  const listClassName = isCompact
    ? 'flex flex-col gap-2'
    : 'flex flex-col gap-3';

  if (inbox.data.length === 0) {
    return (
      <div className={listClassName}>
        <NotificationEmpty isCompact={isCompact} hasSearch={hasSearch} />
      </div>
    );
  }

  const items = inbox.data.map((message) => (
    <NotificationItem
      key={message.id}
      message={message}
      isCompact={isCompact}
      onOpen={onOpen}
      onDelete={onDelete}
    />
  ));

  if (isDesktop) {
    return <div className={listClassName}>{items}</div>;
  }

  return (
    <InfiniteScroll
      data="inbox"
      onlyNext
      preserveUrl
      loading={() => (
        <div className="py-4 text-center text-xs text-muted-foreground">
          Memuat…
        </div>
      )}
    >
      <div className={listClassName}>{items}</div>
    </InfiniteScroll>
  );
}
