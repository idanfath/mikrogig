import { router } from '@inertiajs/react';
import { Eye, X, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import type { NotificationReceivedEvent } from '@/features/notifications/types';
import { isInternalActionUrl, toInertiaHref } from '@/lib/utils';
import app from '@/routes/app';

export function showNotificationToast(e: NotificationReceivedEvent) {
  const isMobile = window.innerWidth < 768;

  toast(
    (t) => (
      <div className="flex w-full gap-3.5">
        <div className="flex-1">
          <p className="text-sm leading-snug font-semibold tracking-tight text-foreground">
            {e.title}
          </p>
          {e.body && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {e.body.length > 90 ? e.body.substring(0, 90) + '...' : e.body}
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="font-semibold"
              onClick={() => {
                toast.dismiss(t.id);
                router.visit(app.notifications.url({ query: { open: e.id } }));
              }}
            >
              <Eye data-icon="inline-start" />
              Lihat
            </Button>

            {e.action_url && (
              <Button
                size="sm"
                className="font-semibold"
                onClick={() => {
                  toast.dismiss(t.id);
                  const url = e.action_url!;

                  if (isInternalActionUrl(url)) {
                    router.visit(toInertiaHref(url));

                    return;
                  }

                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
              >
                <ExternalLink data-icon="inline-start" />
                {e.action_label ?? 'Buka'}
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              className="font-semibold"
              onClick={() => toast.dismiss(t.id)}
            >
              <X data-icon="inline-start" />
              Tutup
            </Button>
          </div>
        </div>
      </div>
    ),
    {
      position: isMobile ? 'top-center' : 'bottom-right',
      duration: 6000,
      className: isMobile
        ? '!w-[calc(100vw-32px)] !max-w-none'
        : 'w-full md:max-w-sm',
      style: {
        maxWidth: 'none',
        width: isMobile ? 'calc(100vw - 32px)' : 'auto',
      },
    },
  );
}
