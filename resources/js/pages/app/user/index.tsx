import { Head, Link, usePage } from '@inertiajs/react';
import { ChevronRight, LogOut, Settings, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { AppPage, AppPageCard } from '@/components/layout/app-page';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import AppLayout from '@/layout/AppLayout';
import { capitalize } from '@/lib/utils';
import app from '@/routes/app';
import type { Auth } from '@/types/auth';
import { Badge } from '@/components/ui/badge';
import { UserRoleFrontendLabel } from '@/types';
import { logout } from '@/routes';

const UserHubPage: InertiaPageWithLayout = () => {
  const { auth } = usePage<{ auth: Auth }>().props;
  const user = auth.user;
  const location =
    user.location ??
    (user.regency_name && user.province_name
      ? `${user.regency_name}, ${user.province_name}`
      : null);

  return (
    <>
      <Head title="Akun" />
      <AppPage>
        <AppPageCard className="flex items-center gap-4">
          <UserAvatar
            user={{ name: user.name, avatar_url: user.avatar_url }}
            size="lg"
          />
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold">{user.name}</h1>
              <Badge>{UserRoleFrontendLabel[user.role]}</Badge>
            </div>
            {location && (
              <p className="text-sm text-muted-foreground">
                {capitalize(location, true)}
              </p>
            )}
            {user.email && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span>{user.email}</span>
              </div>
            )}
          </div>
        </AppPageCard>
        <div className="flex flex-col gap-2">
          <Button asChild variant="outline" className="h-12 justify-between" mobileLarge>
            <Link href={app.profile()}>
              <span className="flex items-center gap-2">
                <UserRound aria-hidden="true" />
                Profil
                <span className='text-muted-foreground'>
                  Lihat dan edit profil Anda
                </span>
              </span>
              <ChevronRight className="text-muted-foreground" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-12 justify-between" mobileLarge>
            <Link href={app.account()}>
              <span className="flex items-center gap-2">
                <Settings aria-hidden="true" />
                Pengaturan
                <span className='text-muted-foreground'>
                  Kelola akun Anda
                </span>
              </span>
              <ChevronRight className="text-muted-foreground" aria-hidden="true" />
            </Link>
          </Button>
          <Button
            asChild
            variant="destructive"
            className="h-12 justify-between"
            mobileLarge
          >
            <Link href={logout()} method="post" className='w-full'>
              <span className="flex items-center gap-2">
                <LogOut aria-hidden="true" />
                Keluar
                <span className='text-destructive/60'>
                  Keluar dari akun Anda
                </span>
              </span>
              <ChevronRight className="text-muted-foreground" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </AppPage >
    </>
  );
};

UserHubPage.layout = (page: ReactNode) => (
  <AppLayout title="Akun">{page}</AppLayout>
);

export default UserHubPage;
