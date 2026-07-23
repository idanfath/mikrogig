import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import type { PaginatedInbox } from '../types';

type NotificationPaginationProps = {
  inbox: PaginatedInbox;
};

export function NotificationPagination({ inbox }: NotificationPaginationProps) {
  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="text-sm text-muted-foreground">
        Halaman {inbox.current_page} dari {inbox.last_page} ({inbox.total}{' '}
        total)
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!inbox.prev_page_url}
          onClick={() =>
            router.visit(inbox.prev_page_url!, {
              preserveScroll: true,
            })
          }
        >
          Sebelumnya
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!inbox.next_page_url}
          onClick={() =>
            router.visit(inbox.next_page_url!, {
              preserveScroll: true,
            })
          }
        >
          Berikutnya
        </Button>
      </div>
    </div>
  );
}
