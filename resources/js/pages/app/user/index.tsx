import { Head, Link, router, usePage } from '@inertiajs/react';
import {
  Calendar,
  ChevronRight,
  LogOut,
  Mail,
  MapPin,
  Settings,
  UserRound,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { AppPage, AppPageCard } from '@/components/layout/app-page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useConfirm } from '@/hooks/use-confirm';
import AppLayout from '@/layout/AppLayout';
import { formatDate } from '@/lib/date';
import { capitalize } from '@/lib/utils';
import { logout } from '@/routes';
import app from '@/routes/app';
import { getUserRoleLabel } from '@/types/enum';
import type { Auth } from '@/types/auth';

const UserHubPage: InertiaPageWithLayout = () => {
  const { auth } = usePage<{ auth: Auth }>().props;
  const [confirm, confirmDialog] = useConfirm();
  const user = auth.user;
  const location =
    user.location ??
    (user.regency_name && user.province_name
      ? `${user.regency_name}, ${user.province_name}`
      : null);

  const handleLogout = () => {
    confirm({
      title: 'Konfirmasi Keluar',
      description: 'Apakah Anda yakin ingin keluar dari akun Anda?',
      confirmLabel: 'Keluar',
      cancelLabel: 'Batal',
      destructive: true,
      onConfirm: () => {
        router.post(logout().url);
      },
    });
  };

  return (
    <>
      <Head title="Akun Saya" />
      <AppPage
        title="Akun Saya"
        description="Akses cepat ke profil, pengaturan keamanan, dan manajemen akun Anda."
      >
        <AppPageCard className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <UserAvatar
              user={{ name: user.name, avatar_url: user.avatar_url }}
              size="lg"
              className="size-16 text-lg shrink-0"
            />
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-lg font-bold sm:text-xl text-foreground">
                  {user.name}
                </h1>
                <Badge variant="outline" className="px-2 py-0.5 text-xs">
                  {getUserRoleLabel(user.role)}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="size-3.5 shrink-0 text-muted-foreground/70" />
                    <span>{capitalize(location, true)}</span>
                  </div>
                )}
                {user.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="size-3.5 shrink-0 text-muted-foreground/70" />
                    <span>{user.email}</span>
                  </div>
                )}
                {user.created_at && (
                  <div className="flex items-center gap-1">
                    <Calendar className="size-3.5 shrink-0 text-muted-foreground/70" />
                    <span>Bergabung {formatDate(user.created_at, 'MMM yyyy')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </AppPageCard>

        <div className="grid gap-3">
          <Link
            href={app.profile()}
            className="group flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card p-4 transition-all hover:bg-secondary/60 hover:border-border"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/40 transition-colors group-hover:bg-background">
                <UserRound className="size-5 text-foreground" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-foreground">
                  Profil Saya
                </span>
                <span className="text-xs text-muted-foreground">
                  Lihat dan perbarui informasi pribadi, keahlian, serta bio Anda
                </span>
              </div>
            </div>
            <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 shrink-0" />
          </Link>

          <Link
            href={app.account()}
            className="group flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card p-4 transition-all hover:bg-secondary/60 hover:border-border"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/40 transition-colors group-hover:bg-background">
                <Settings className="size-5 text-foreground" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-foreground">
                  Pengaturan Akun
                </span>
                <span className="text-xs text-muted-foreground">
                  Kelola kata sandi, preferensi keamanan, dan data akun
                </span>
              </div>
            </div>
            <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 shrink-0" />
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="group flex items-center justify-between gap-4 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-left transition-all hover:bg-destructive/10 hover:border-destructive/30"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-destructive/30 bg-destructive/10 transition-colors group-hover:bg-destructive/20">
                <LogOut className="size-5 text-destructive" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-destructive">
                  Keluar Akun
                </span>
                <span className="text-xs text-destructive/80">
                  Akhiri sesi dan keluar dari aplikasi MikroGig
                </span>
              </div>
            </div>
            <ChevronRight className="size-5 text-destructive/70 transition-transform group-hover:translate-x-0.5 shrink-0" />
          </button>
        </div>

        {confirmDialog}
      </AppPage>
    </>
  );
};

UserHubPage.layout = (page: ReactNode) => (
  <AppLayout title="Akun Saya">{page}</AppLayout>
);

export default UserHubPage;
