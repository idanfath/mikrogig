import { Link, usePage } from '@inertiajs/react';
import { Bell, ChevronsUpDown, LogOut, Settings, UserRound } from 'lucide-react';

import { appNavigation } from '@/components/layout/app-navigation';
import { UserAvatar } from '@/components/ui/user-avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { logout } from '@/routes';
import app from '@/routes/app';
import type { Auth } from '@/types/auth';

type AppSidebarProps = {
  className?: string;
};

function AppSidebar({ className }: AppSidebarProps) {
  const {
    url,
    props: { auth },
  } = usePage<{ auth: Auth }>();
  const { isMobile } = useSidebar();
  const currentPath = url.split('?')[0];
  const user = auth.user;

  return (
    <Sidebar className={className} collapsible="icon">
      <SidebarContent>
        {appNavigation.map((category) => (
          <SidebarGroup key={category.id}>
            <SidebarGroupLabel>{category.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {category.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPath === item.href.url;

                  return (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                      >
                        <Link
                          href={item.href}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          <Icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" tooltip="Akun">
                  <UserAvatar user={user} size="sm" />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto" aria-hidden="true" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                side={isMobile ? 'bottom' : 'right'}
                sideOffset={4}
              >
                <DropdownMenuLabel className="flex flex-col gap-1">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate font-normal text-muted-foreground">
                    {user.email}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={app.profile()}>
                    <UserRound aria-hidden="true" />
                    Profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={app.account()}>
                    <Settings aria-hidden="true" />
                    Pengaturan
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={app.notifications()}>
                    <Bell aria-hidden="true" />
                    Notifikasi
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild variant="destructive">
                  <Link href={logout()} method="post" className='w-full'>
                    <LogOut aria-hidden="true" />
                    Keluar
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export { AppSidebar };
