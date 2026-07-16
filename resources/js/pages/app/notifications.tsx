import { Head, router, usePage } from '@inertiajs/react';
import { ReactElement, ReactNode, useEffect, useState } from 'react';
import AppLayout from '@/layout/AppLayout';
import { formatRelativeTime } from '@/lib/date';
import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/hooks/use-media-query';
import app from '@/routes/app';
import { Eye, Trash2, ExternalLink } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

type InertiaPageWithLayout = (() => ReactElement) & {
  layout?: (page: ReactNode) => ReactNode;
};

type InboxMessage = {
  id: number;
  title: string;
  body: string | null;
  action_url: string | null;
  action_label: string | null;
  created_at: string;
  read_at: string | null;
};

type PageProps = {
  inbox: InboxMessage[];
};

const Notifications: InertiaPageWithLayout = () => {
  const { inbox } = usePage<PageProps>().props;
  const [selected, setSelected] = useState<InboxMessage | null>(null);
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const openId = params.get('open');
    if (openId) {
      const id = parseInt(openId, 10);
      const message = inbox.find((m) => m.id === id);
      if (message) {
        handleOpen(message);
        // clean up  URL query param so refreshing doesn't keep opening it
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [inbox]);

  const handleOpen = (message: InboxMessage) => {
    setSelected(message);
    setOpen(true);
    if (!message.read_at) {
      router.post(
        app.notifications.read.url({ id: message.id }),
        {},
        {
          preserveScroll: true,
        },
      );
    }
  };

  const handleDelete = (id: number) => {
    router.delete(app.notifications.destroy.url({ id }), {
      preserveScroll: true,
      onSuccess: () => setOpen(false),
    });
  };

  const handleMarkAllRead = () => {
    router.post(
      app.notifications.readAll.url(),
      {},
      {
        preserveScroll: true,
      },
    );
  };

  const allRead = inbox.every((msg) => msg.read_at !== null);

  const renderDetails = () => {
    if (!selected) return null;

    return (
      <div className="flex flex-col gap-4 text-left">
        <div className="max-h-[50vh] overflow-y-auto pr-2 text-base leading-relaxed text-foreground">
          {selected.body ?? 'Tidak ada detail pesan.'}
        </div>
        <div className="mt-4 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:justify-end sm:gap-3">
          <Button
            variant="destructive"
            onClick={() => handleDelete(selected.id)}
            className="w-full sm:w-auto"
          >
            <Trash2 data-icon="inline-start" />
            Hapus
          </Button>
          {selected.action_url && (
            <Button asChild className="w-full sm:w-auto">
              <a
                href={selected.action_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink data-icon="inline-end" />
                {selected.action_label ?? 'Buka Link'}
              </a>
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl px-4">
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm">
        <div className="flex flex-col gap-4 border-b px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Inbox</h2>
            <p className="text-sm text-muted-foreground">
              Your latest backend notifications
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={allRead || inbox.length === 0}
          >
            Tandai Semua Dibaca
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4 py-3">Title</TableHead>
              <TableHead className="px-4 py-3">Body</TableHead>
              <TableHead className="px-4 py-3">Status</TableHead>
              <TableHead className="px-4 py-3">
                Received
              </TableHead>
              <TableHead className="px-4 py-3 text-right">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inbox.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-6 text-center text-muted-foreground"
                >
                  Tidak ada notifikasi.
                </TableCell>
              </TableRow>
            ) : (
              inbox.map((message) => {
                const isUnread = !message.read_at;

                return (
                  <TableRow
                    key={message.id}
                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${isUnread ? 'bg-primary/5 font-semibold' : ''}`}
                    onClick={() => handleOpen(message)}
                  >
                    <TableCell className="max-w-50 truncate px-4 py-3">
                      {message.title}
                    </TableCell>
                    <TableCell className="max-w-xs truncate px-4 py-3 text-muted-foreground">
                      {message.body ?? '-'}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {isUnread ? (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-700/10 ring-inset">
                          Unread
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-500/10 ring-inset">
                          Read
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {formatRelativeTime(
                        message.created_at,
                      )}
                    </TableCell>
                    <TableCell
                      className="px-4 py-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() =>
                            handleOpen(message)
                          }
                          title="Buka"
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() =>
                            handleDelete(message.id)
                          }
                          title="Hapus"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {isDesktop ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {selected?.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Diterima{' '}
                {selected &&
                  formatRelativeTime(selected.created_at)}
              </DialogDescription>
            </DialogHeader>
            {renderDetails()}
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="px-4 pb-6">
            <DrawerHeader className="px-0 text-left">
              <DrawerTitle className="text-xl font-bold">
                {selected?.title}
              </DrawerTitle>
              <DrawerDescription className="text-xs text-muted-foreground">
                Diterima{' '}
                {selected &&
                  formatRelativeTime(selected.created_at)}
              </DrawerDescription>
            </DrawerHeader>
            {renderDetails()}
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
};

Notifications.layout = (page: ReactNode) => (
  <AppLayout title="Notifikasi">{page}</AppLayout>
);

export default Notifications;
