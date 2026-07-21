import { ExternalLink, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { InboxMessage } from './types';
import { Link } from '@inertiajs/react';
import { isInternalActionUrl, toInertiaHref } from '@/lib/utils';

type NotificationDetailProps = {
  message: InboxMessage;
  onDelete: (id: number) => void;
};

export function NotificationDetail({
  message,
  onDelete,
}: NotificationDetailProps) {
  const actionUrl = message.action_url;
  const actionLabel = message.action_label ?? 'Buka Link';
  const isInternal = actionUrl ? isInternalActionUrl(actionUrl) : false;

  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="max-h-[50vh] overflow-y-auto pr-2 text-base leading-relaxed text-foreground">
        {message.body ?? 'Tidak ada detail pesan.'}
      </div>
      <div className="mt-4 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:justify-end sm:gap-3">
        <Button
          variant="destructive"
          onClick={() => onDelete(message.id)}
          className="w-full sm:w-auto"
        >
          <Trash2 data-icon="inline-start" />
          Hapus
        </Button>
        {actionUrl ? (
          <Button asChild className="w-full sm:w-auto">
            {isInternal ? (
              <Link href={toInertiaHref(actionUrl)}>
                <ExternalLink data-icon="inline-end" />
                {actionLabel}
              </Link>
            ) : (
              <a href={actionUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink data-icon="inline-end" />
                {actionLabel}
              </a>
            )}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
