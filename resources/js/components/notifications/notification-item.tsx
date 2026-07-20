import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/date';
import type { InboxMessage } from './types';

type NotificationItemProps = {
  message: InboxMessage;
  isCompact: boolean;
  onOpen: (message: InboxMessage) => void;
  onDelete: (id: number) => void;
};

export function NotificationItem({
  message,
  isCompact,
  onOpen,
  onDelete,
}: NotificationItemProps) {
  const isUnread = !message.read_at;

  return (
    <div
      className={`flex cursor-pointer items-start justify-between gap-4 bg-muted transition-colors duration-200 hover:outline-1  ${isCompact ? 'rounded-xl p-3.5' : 'rounded-2xl p-5'
        } ${isUnread ? 'bg-primary/4 ring-1 ring-primary/10' : ''}`}
      onClick={() => onOpen(message)}
    >
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <div
          className={`relative flex shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ${isCompact ? 'mt-0 size-8' : 'mt-0.5 size-9'
            }`}
        >
          <Bell className={isCompact ? 'size-3.5' : 'size-4'} />
          {isUnread && (
            <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-blue-600 ring-2 ring-background" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p
              className={`line-clamp-1 text-sm tracking-tight text-foreground ${isUnread ? 'font-semibold' : 'font-medium'}`}
            >
              {message.title}
            </p>
            {!isUnread && (
              <Badge variant="outline" size="sm">
                Dibaca
              </Badge>
            )}
          </div>
          <p
            className={`text-xs leading-relaxed text-muted-foreground ${isCompact ? 'mt-0.5 line-clamp-1' : 'mt-1 line-clamp-2'
              }`}
          >
            {message.body ?? 'Tidak ada detail pesan.'}
          </p>
          <span
            className={`block font-medium text-muted-foreground/80 ${isCompact ? 'mt-1 text-[10px]' : 'mt-2 text-[11px]'
              }`}
          >
            {formatRelativeTime(message.created_at)}
          </span>
        </div>
      </div>

      <div
        className="flex shrink-0 items-center gap-1.5 self-center"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="outline"
          size="sm"
          className={`font-semibold transition-none ${isCompact ? 'h-6 px-2 text-[10px]' : 'h-7 px-2.5 text-[11px]'}`}
          onClick={() => onOpen(message)}
        >
          Lihat
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`font-semibold text-destructive transition-none hover:bg-destructive/10 hover:text-destructive ${isCompact ? 'h-6 px-2 text-[10px]' : 'h-7 px-2.5 text-[11px]'
            }`}
          onClick={() => onDelete(message.id)}
        >
          Hapus
        </Button>
      </div>
    </div>
  );
}
