import { router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PaginatedInbox } from '../types';

type NotificationToolbarProps = {
  inbox: PaginatedInbox;
  isDesktop: boolean;
  isCompact: boolean;
  unreadCount: number;
  onToggleCompact: () => void;
  onMarkAllRead: () => void;
};

export function NotificationToolbar({
  inbox,
  isDesktop,
  isCompact,
  unreadCount,
  onToggleCompact,
  onMarkAllRead,
}: NotificationToolbarProps) {
  return (
    <div className="flex flex-row flex-wrap items-center justify-between gap-2">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Kotak Masuk</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Notifikasi terbaru Anda
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        {isDesktop && (
          <>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={!inbox.prev_page_url}
              onClick={() =>
                router.visit(inbox.prev_page_url!, {
                  preserveScroll: true,
                })
              }
              title="Sebelumnya"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={!inbox.next_page_url}
              onClick={() =>
                router.visit(inbox.next_page_url!, {
                  preserveScroll: true,
                })
              }
              title="Berikutnya"
            >
              <ChevronRight className="size-4" />
            </Button>
          </>
        )}
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={onToggleCompact}
            title={isCompact ? 'Tampilan Renggang' : 'Tampilan Padat'}
          >
            {isCompact ? (
              <Maximize2 className="size-4" />
            ) : (
              <Minimize2 className="size-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onMarkAllRead}
            disabled={unreadCount === 0}
          >
            Tandai Semua Dibaca
          </Button>
        </div>
      </div>
    </div>
  );
}
