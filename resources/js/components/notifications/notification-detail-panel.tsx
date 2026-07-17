import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { formatRelativeTime } from '@/lib/date';
import { NotificationDetail } from './notification-detail';
import type { InboxMessage } from './types';

type NotificationDetailPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: InboxMessage | null;
  isDesktop: boolean;
  onDelete: (id: number) => void;
};

export function NotificationDetailPanel({
  open,
  onOpenChange,
  selected,
  isDesktop,
  onDelete,
}: NotificationDetailPanelProps) {
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selected?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Diterima {selected && formatRelativeTime(selected.created_at)}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <NotificationDetail message={selected} onDelete={onDelete} />
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-4 pb-6">
        <DrawerHeader className="px-0 text-left">
          <DrawerTitle className="text-xl font-bold">
            {selected?.title}
          </DrawerTitle>
          <DrawerDescription className="text-xs text-muted-foreground">
            Diterima {selected && formatRelativeTime(selected.created_at)}
          </DrawerDescription>
        </DrawerHeader>
        {selected && (
          <NotificationDetail message={selected} onDelete={onDelete} />
        )}
      </DrawerContent>
    </Drawer>
  );
}
