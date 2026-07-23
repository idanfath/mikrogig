import { Link } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import app from '@/routes/app';

export function NotificationSidebarItem() {
  return (
    <DropdownMenuItem asChild>
      <Link href={app.notifications()}>
        <Bell aria-hidden="true" />
        Notifikasi
      </Link>
    </DropdownMenuItem>
  );
}
