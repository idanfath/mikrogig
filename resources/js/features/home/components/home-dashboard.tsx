import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    AlertTriangle,
    ArrowRight,
    Ban,
    BriefcaseBusiness,
    CalendarClock,
    CheckCircle2,
    ClipboardCheck,
    Clock3,
    Coins,
    FileCheck2,
    Gavel,
    HandCoins,
    Inbox,
    ListChecks,
    MessageCircle,
    MessageSquareWarning,
    Search,
    ShieldAlert,
    Star,
    Users,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { AppPage, AppPageCard } from '@/components/layout/app-page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useServerClock } from '@/hooks/use-server-clock';
import { formatDate, formatRelativeTime } from '@/lib/date';
import { getServerCountdown } from '@/lib/server-time';
import { cn } from '@/lib/utils';
import app from '@/routes/app';
import { show as showAdminDispute } from '@/routes/app/admin/gig_disputes';
import { index as showApplicants } from '@/routes/app/client/gigs/applicants';
import {
    destination as conversationDestination,
    show as showConversation,
} from '@/routes/app/gig_conversations';
import { show as showDispute } from '@/routes/app/gig_disputes';
import { create as createGig, index as findGigs } from '@/routes/app/gigs';
import { show as showAgreement } from '@/routes/app/gigs/agreement';
import { show as showPayment } from '@/routes/app/gigs/payment';
import { show as showWorkflow } from '@/routes/app/gigs/workflow';
import {
    index as showHistoryIndex,
    show as showHistory,
} from '@/routes/app/history';
import {
    getGigStatusLabel,
    NotificationCategory,
    UserRole,
} from '@/types/enum';

import { useHomeRealtime } from '../hooks/use-home-realtime';
import { HomeAccountState, HomeActionKind, HomeActionPriority } from '../types';
import type {
    AdminHomeData,
    ChatNotices,
    ClientHomeData,
    FreelancerHomeData,
    HomeAction,
    HomeActionKind as HomeActionKindType,
    HomeActionPriority as HomeActionPriorityType,
    HomeData,
    SuspendedHomeData,
} from '../types';

const actionAppearance: Record<
    HomeActionKindType,
    { icon: LucideIcon; label: string }
> = {
    [HomeActionKind.Agreement]: {
        icon: FileCheck2,
        label: 'Kesepakatan',
    },
    [HomeActionKind.Applicants]: {
        icon: Users,
        label: 'Pelamar',
    },
    [HomeActionKind.Counterproof]: {
        icon: MessageSquareWarning,
        label: 'Sengketa',
    },
    [HomeActionKind.DisputeDecision]: {
        icon: Gavel,
        label: 'Keputusan',
    },
    [HomeActionKind.ExitRequest]: {
        icon: AlertTriangle,
        label: 'Permintaan keluar',
    },
    [HomeActionKind.FinalTerms]: {
        icon: ClipboardCheck,
        label: 'Syarat akhir',
    },
    [HomeActionKind.FinishRequest]: {
        icon: CheckCircle2,
        label: 'Penyelesaian',
    },
    [HomeActionKind.FinishReview]: {
        icon: ClipboardCheck,
        label: 'Tinjauan',
    },
    [HomeActionKind.Payment]: {
        icon: HandCoins,
        label: 'Pembayaran',
    },
    [HomeActionKind.Rating]: {
        icon: Star,
        label: 'Penilaian',
    },
    [HomeActionKind.WorkStart]: {
        icon: CalendarClock,
        label: 'Jadwal kerja',
    },
};

function formatRupiah(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);
}

function getActionHref(action: HomeAction) {
    return matchActionTarget(action.target.type, action.target.id);
}

function matchActionTarget(type: HomeAction['target']['type'], id: number) {
    switch (type) {
        case 'agreement':
            return showAgreement(id);
        case 'applicants':
            return showApplicants(id);
        case 'dispute':
            return showDispute(id);
        case 'admin_dispute':
            return showAdminDispute(id);
        case 'history':
            return showHistory(id);
        case 'payment':
            return showPayment(id);
        case 'workflow':
            return showWorkflow(id);
    }
}

function getPageDescription(data: HomeData): string {
    if (data.account_state === HomeAccountState.Suspended) {
        return 'Lihat status penangguhan dan riwayat gig yang masih dapat diakses.';
    }

    if (data.role === UserRole.Client) {
        return 'Tindakan penting untuk menjaga gig dan pembayaran tetap berjalan.';
    }

    if (data.role === UserRole.Freelancer) {
        return 'Jadwal, batas lamaran, dan pekerjaan yang membutuhkan perhatian Anda.';
    }

    return 'Sengketa dengan deadline terdekat dan tindakan admin yang menunggu.';
}

function ChatNoticeCard({ notices }: { notices: ChatNotices }) {
    const isMobile = useIsMobile();

    if (notices.data.length === 0) {
        return null;
    }

    return (
        <AppPageCard className="overflow-hidden p-0">
            <header className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-4 sm:px-5">
                <div className="flex items-center gap-2.5">
                    <MessageCircle
                        className="size-4.5 text-primary"
                        aria-hidden="true"
                    />
                    <div>
                        <h2 className="font-semibold">Pesan belum dibaca</h2>
                        <p className="text-xs text-muted-foreground">
                            Percakapan gig yang perlu dilihat
                        </p>
                    </div>
                </div>
                <Badge>{notices.data.length}</Badge>
            </header>

            <div className="divide-y divide-border/60">
                {notices.data.map((notice) => {
                    const route = isMobile
                        ? showConversation(notice.agreement_id, {
                              query: {
                                  chat_focus: notice.latest_message_id,
                              },
                          })
                        : conversationDestination(notice.agreement_id, {
                              query: {
                                  chat_focus: notice.latest_message_id,
                              },
                          });

                    return (
                        <Link
                            key={notice.agreement_id}
                            href={route}
                            className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50 sm:px-5"
                        >
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                {notice.sender.name.slice(0, 1).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="truncate text-sm font-semibold">
                                        {notice.sender.name}
                                    </p>
                                    <Badge size="sm">
                                        {notice.unread_count}
                                    </Badge>
                                </div>
                                <p className="truncate text-xs text-muted-foreground">
                                    {notice.gig_title}
                                </p>
                            </div>
                            <span className="shrink-0 text-xs text-muted-foreground">
                                {formatRelativeTime(notice.created_at)}
                            </span>
                        </Link>
                    );
                })}
            </div>

            {notices.has_more && (
                <div className="border-t border-border/60 p-3 text-center">
                    <Button asChild variant="ghost" size="sm">
                        <Link
                            href={app.notifications({
                                query: {
                                    category: NotificationCategory.Chat,
                                },
                            })}
                        >
                            Lihat pesan lainnya
                            <ArrowRight
                                data-icon="inline-end"
                                aria-hidden="true"
                            />
                        </Link>
                    </Button>
                </div>
            )}
        </AppPageCard>
    );
}

function PriorityBadge({ priority }: { priority: HomeActionPriorityType }) {
    if (priority === HomeActionPriority.Critical) {
        return (
            <Badge variant="destructive" size="sm">
                Mendesak
            </Badge>
        );
    }

    if (priority === HomeActionPriority.Warning) {
        return (
            <Badge variant="warning" size="sm">
                Perlu perhatian
            </Badge>
        );
    }

    return (
        <Badge variant="secondary" size="sm">
            Tindakan
        </Badge>
    );
}

function ActionItem({
    action,
    currentServerTime,
}: {
    action: HomeAction;
    currentServerTime: string;
}) {
    const appearance = actionAppearance[action.kind];
    const Icon = appearance.icon;
    const isExpired =
        action.due_at !== null &&
        new Date(action.due_at).getTime() <=
            new Date(currentServerTime).getTime();

    return (
        <article className="flex flex-col gap-4 p-4 sm:p-5">
            <div className="flex min-w-0 items-start gap-3.5">
                <div
                    className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-xl',
                        action.priority === HomeActionPriority.Critical &&
                            'bg-destructive-soft text-destructive',
                        action.priority === HomeActionPriority.Warning &&
                            'bg-warning-soft text-warning',
                        action.priority === HomeActionPriority.Normal &&
                            'bg-secondary text-secondary-foreground',
                    )}
                >
                    <Icon className="size-4.5" aria-hidden="true" />
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" size="sm">
                            {appearance.label}
                        </Badge>
                        <PriorityBadge priority={action.priority} />
                    </div>

                    <div className="flex min-w-0 flex-col gap-1">
                        <h3 className="font-semibold tracking-tight">
                            {action.title}
                        </h3>
                        {action.gig_title && (
                            <p className="line-clamp-1 text-xs font-medium text-foreground/75">
                                {action.gig_title}
                            </p>
                        )}
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            {action.description}
                        </p>
                    </div>

                    {action.due_at && (
                        <div
                            className={cn(
                                'flex flex-wrap items-center gap-x-2 gap-y-1 text-xs',
                                isExpired ||
                                    action.priority ===
                                        HomeActionPriority.Critical
                                    ? 'font-medium text-destructive'
                                    : 'text-muted-foreground',
                            )}
                        >
                            <Clock3 className="size-3.5" aria-hidden="true" />
                            <span>
                                {isExpired
                                    ? 'Batas waktu berakhir'
                                    : `${getServerCountdown(action.due_at, currentServerTime)} lagi`}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>
                                {formatDate(action.due_at, 'dd MMM · HH:mm')}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <Button
                asChild
                size="sm"
                variant={
                    action.priority === HomeActionPriority.Critical
                        ? 'destructive'
                        : 'outline'
                }
                className="w-full self-start sm:w-auto sm:self-end"
            >
                <Link href={getActionHref(action)}>
                    {action.action_label}
                    <ArrowRight data-icon="inline-end" aria-hidden="true" />
                </Link>
            </Button>
        </article>
    );
}

function EmptyActions({ role }: { role: UserRole }) {
    const hasPrimaryAction = role !== UserRole.Admin;
    const title =
        role === UserRole.Admin
            ? 'Antrean sedang bersih'
            : 'Belum ada yang perlu ditangani';
    const description =
        role === UserRole.Client
            ? 'Buat gig baru saat Anda membutuhkan bantuan dari pekerja lokal.'
            : role === UserRole.Freelancer
              ? 'Cari pekerjaan lokal yang sesuai dengan keterampilan dan lokasi Anda.'
              : 'Tidak ada sengketa atau deadline yang membutuhkan tindakan admin.';

    return (
        <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Inbox className="size-5" aria-hidden="true" />
            </div>
            <div className="flex max-w-md flex-col gap-1">
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    {description}
                </p>
            </div>
            {hasPrimaryAction && (
                <Button asChild size="sm">
                    <Link
                        href={
                            role === UserRole.Client ? createGig() : findGigs()
                        }
                    >
                        {role === UserRole.Client ? (
                            <BriefcaseBusiness
                                data-icon="inline-start"
                                aria-hidden="true"
                            />
                        ) : (
                            <Search
                                data-icon="inline-start"
                                aria-hidden="true"
                            />
                        )}
                        {role === UserRole.Client ? 'Buat Gig' : 'Cari Gig'}
                    </Link>
                </Button>
            )}
        </div>
    );
}

function ActionList({
    data,
    currentServerTime,
}: {
    data: ClientHomeData | FreelancerHomeData | AdminHomeData;
    currentServerTime: string;
}) {
    const hasActions = data.actions.length > 0;

    return (
        <AppPageCard className="overflow-hidden p-0">
            <header className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-4 sm:px-5">
                <div className="flex items-center gap-2.5">
                    <ListChecks
                        className="size-4.5 text-primary"
                        aria-hidden="true"
                    />
                    <div>
                        <h2 className="font-semibold">Perlu tindakan</h2>
                        <p className="text-xs text-muted-foreground">
                            Prioritas Anda saat ini
                        </p>
                    </div>
                </div>
                <Badge variant={hasActions ? 'default' : 'secondary'}>
                    {data.actions.length}
                </Badge>
            </header>

            {hasActions ? (
                <div className="divide-y divide-border/60">
                    {data.actions.map((action) => (
                        <ActionItem
                            key={action.id}
                            action={action}
                            currentServerTime={currentServerTime}
                        />
                    ))}
                </div>
            ) : (
                <EmptyActions role={data.role} />
            )}
        </AppPageCard>
    );
}

function RatingReminderList({
    reminders,
    currentServerTime,
}: {
    reminders: HomeAction[];
    currentServerTime: string;
}) {
    const hasReminders = reminders.length > 0;

    if (!hasReminders) {
        return null;
    }

    return (
        <AppPageCard className="overflow-hidden p-0">
            <header className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-4 sm:px-5">
                <div className="flex items-center gap-2.5">
                    <Star
                        className="size-4.5 text-primary"
                        aria-hidden="true"
                    />
                    <div>
                        <h2 className="font-semibold">Penilaian tertunda</h2>
                        <p className="text-xs text-muted-foreground">
                            Bagikan pengalaman setelah gig selesai
                        </p>
                    </div>
                </div>
                <Badge>{reminders.length}</Badge>
            </header>

            <div className="divide-y divide-border/60">
                {reminders.map((reminder) => (
                    <ActionItem
                        key={reminder.id}
                        action={reminder}
                        currentServerTime={currentServerTime}
                    />
                ))}
            </div>
        </AppPageCard>
    );
}

function Metric({
    label,
    value,
    emphasis = false,
}: {
    label: string;
    value: string | number;
    emphasis?: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-3 py-2.5">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd
                className={cn(
                    'text-sm font-semibold',
                    emphasis && 'text-primary',
                )}
            >
                {value}
            </dd>
        </div>
    );
}

function RailCard({
    icon: Icon,
    title,
    children,
}: {
    icon: LucideIcon;
    title: string;
    children: ReactNode;
}) {
    return (
        <AppPageCard className="flex flex-col gap-3 p-4">
            <div className="flex items-center gap-2">
                <Icon
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                />
                <h2 className="text-sm font-semibold">{title}</h2>
            </div>
            {children}
        </AppPageCard>
    );
}

function ClientRail({ data }: { data: ClientHomeData }) {
    return (
        <div className="flex flex-col gap-4">
            <RailCard icon={Coins} title="Ringkasan gig">
                <dl className="divide-y divide-border/60">
                    <Metric
                        label="Pembayaran ditahan"
                        value={formatRupiah(data.summary.held_amount)}
                        emphasis
                    />
                    <Metric
                        label="Gig aktif"
                        value={data.summary.active_gigs}
                    />
                    <Metric
                        label="Pelamar baru"
                        value={data.summary.new_applicants}
                    />
                    <Metric
                        label="Rating tertunda"
                        value={data.summary.pending_ratings}
                    />
                </dl>
            </RailCard>

            <Button asChild mobileLarge>
                <Link href={createGig()}>
                    <BriefcaseBusiness
                        data-icon="inline-start"
                        aria-hidden="true"
                    />
                    Buat Gig
                </Link>
            </Button>
        </div>
    );
}

function FreelancerRail({ data }: { data: FreelancerHomeData }) {
    const isApplicationLimitReached =
        data.summary.active_applications >= data.summary.application_limit;

    return (
        <div className="flex flex-col gap-4">
            {data.exclusive_gig && (
                <RailCard icon={ShieldAlert} title="Eksklusivitas aktif">
                    <div className="flex flex-col gap-2">
                        <Badge variant="warning" className="self-start">
                            Lamaran baru dikunci
                        </Badge>
                        <p className="text-sm leading-snug font-medium">
                            {data.exclusive_gig.title}
                        </p>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                            Anda tidak dapat melamar gig lain sampai pekerjaan
                            aktif mencapai status terminal.
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            <Badge variant="outline" size="sm">
                                {getGigStatusLabel(data.exclusive_gig.status)}
                            </Badge>
                            <span className="text-muted-foreground">
                                Mulai{' '}
                                {formatDate(
                                    data.exclusive_gig.starts_at,
                                    'dd MMM · HH:mm',
                                )}
                            </span>
                        </div>
                    </div>
                </RailCard>
            )}

            <RailCard icon={BriefcaseBusiness} title="Kapasitas kerja">
                <dl className="divide-y divide-border/60">
                    <Metric
                        label="Lamaran aktif"
                        value={`${data.summary.active_applications}/${data.summary.application_limit}`}
                        emphasis={isApplicationLimitReached}
                    />
                    <Metric
                        label="Gig selesai"
                        value={data.summary.completed_gigs}
                    />
                </dl>
                {isApplicationLimitReached && (
                    <p className="rounded-xl bg-warning-soft p-3 text-xs leading-relaxed text-warning">
                        Semua slot lamaran sedang digunakan. Tarik salah satu
                        lamaran untuk membuka slot.
                    </p>
                )}
            </RailCard>

            <Button
                asChild={!data.exclusive_gig}
                mobileLarge
                disabled={Boolean(data.exclusive_gig)}
            >
                {data.exclusive_gig ? (
                    <>
                        <Search data-icon="inline-start" aria-hidden="true" />
                        Cari Gig
                    </>
                ) : (
                    <Link href={findGigs()}>
                        <Search data-icon="inline-start" aria-hidden="true" />
                        Cari Gig
                    </Link>
                )}
            </Button>
        </div>
    );
}

function AdminRail({ data }: { data: AdminHomeData }) {
    return (
        <div className="flex flex-col gap-4">
            <RailCard icon={Gavel} title="Antrean sengketa">
                <dl className="divide-y divide-border/60">
                    <Metric
                        label="Menunggu admin"
                        value={data.summary.awaiting_admin}
                        emphasis
                    />
                    <Metric
                        label="Menunggu counterproof"
                        value={data.summary.awaiting_counterproof}
                    />
                    <Metric
                        label="Berakhir hari ini"
                        value={data.summary.expiring_today}
                    />
                </dl>
            </RailCard>
        </div>
    );
}

function HomeRail({
    data,
}: {
    data: ClientHomeData | FreelancerHomeData | AdminHomeData;
}) {
    if (data.role === UserRole.Client) {
        return <ClientRail data={data} />;
    }

    if (data.role === UserRole.Freelancer) {
        return <FreelancerRail data={data} />;
    }

    return <AdminRail data={data} />;
}

function SuspendedHome({
    data,
    currentServerTime,
}: {
    data: SuspendedHomeData;
    currentServerTime: string;
}) {
    return (
        <AppPageCard className="overflow-hidden p-0">
            <div className="flex flex-col gap-5 border-b border-border/60 bg-destructive-soft/60 p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                        {data.suspension.is_permanent ? (
                            <Ban className="size-5" aria-hidden="true" />
                        ) : (
                            <ShieldAlert
                                className="size-5"
                                aria-hidden="true"
                            />
                        )}
                    </div>
                    <Badge variant="destructive" size="lg">
                        {data.suspension.is_permanent
                            ? 'Ditangguhkan permanen'
                            : 'Ditangguhkan sementara'}
                    </Badge>
                </div>

                <div className="flex max-w-2xl flex-col gap-1.5">
                    <h2 className="text-xl font-semibold tracking-tight">
                        Akses fitur bisnis dihentikan
                    </h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        Pengaturan akun, notifikasi, dan riwayat terminal tetap
                        dapat diakses selama masa penangguhan.
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-5 p-5 sm:p-6">
                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                    <div className="flex flex-col gap-1 sm:col-span-2">
                        <dt className="text-muted-foreground">Alasan</dt>
                        <dd>{data.suspension.reason}</dd>
                    </div>
                    <div className="flex flex-col gap-1">
                        <dt className="text-muted-foreground">Mulai</dt>
                        <dd>
                            {formatDate(
                                data.suspension.banned_at,
                                'dd MMMM yyyy · HH:mm',
                            )}
                        </dd>
                    </div>
                    <div className="flex flex-col gap-1">
                        <dt className="text-muted-foreground">Berakhir</dt>
                        <dd>
                            {data.suspension.banned_until
                                ? formatDate(
                                      data.suspension.banned_until,
                                      'dd MMMM yyyy · HH:mm',
                                  )
                                : 'Tidak terbatas'}
                        </dd>
                    </div>
                </dl>

                {data.suspension.banned_until && (
                    <div className="flex items-center gap-2 rounded-xl bg-muted p-3 text-sm">
                        <Clock3
                            className="size-4 shrink-0 text-destructive"
                            aria-hidden="true"
                        />
                        <span className="font-medium">
                            Tersisa{' '}
                            {getServerCountdown(
                                data.suspension.banned_until,
                                currentServerTime,
                            )}
                        </span>
                    </div>
                )}

                {data.suspension.gig_title && (
                    <div className="flex flex-col gap-1 rounded-xl border bg-card p-4 text-sm">
                        <span className="text-xs text-muted-foreground">
                            Gig terkait
                        </span>
                        <span className="font-medium">
                            {data.suspension.gig_title}
                        </span>
                    </div>
                )}

                <Button asChild variant="outline" className="self-start">
                    <Link href={showHistoryIndex()}>
                        Lihat riwayat terminal
                        <ArrowRight data-icon="inline-end" aria-hidden="true" />
                    </Link>
                </Button>
            </div>
        </AppPageCard>
    );
}

export function HomeDashboard({
    data,
    chatNotices,
}: {
    data: HomeData;
    chatNotices: ChatNotices;
}) {
    useHomeRealtime();
    const currentServerTime = useServerClock(data.server_now);
    const firstName = data.viewer_name.split(' ')[0];

    return (
        <AppPage
            title={`Selamat datang, ${firstName}`}
            description={getPageDescription(data)}
        >
            {data.account_state === HomeAccountState.Suspended ? (
                <SuspendedHome
                    data={data}
                    currentServerTime={currentServerTime}
                />
            ) : (
                <div className="flex flex-col gap-4">
                    <ChatNoticeCard notices={chatNotices} />
                    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
                        <ActionList
                            data={data}
                            currentServerTime={currentServerTime}
                        />
                        <HomeRail data={data} />
                    </div>
                    <RatingReminderList
                        reminders={data.rating_reminders}
                        currentServerTime={currentServerTime}
                    />
                </div>
            )}
        </AppPage>
    );
}
