import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Layout from '@/layout/Layout';
import { logout } from '@/routes';
import { User } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { ReactElement, ReactNode } from 'react';

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
  user: User;
  inbox: InboxMessage[];
};

function InboxBuilder({ inbox }: { inbox: InboxMessage[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm">
      <div className="border-b px-6 py-4">
        <h2 className="text-lg font-semibold">Inbox</h2>
        <p className="text-sm text-muted-foreground">Your latest backend notifications</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-4 py-3">Title</TableHead>
            <TableHead className="px-4 py-3">Body</TableHead>
            <TableHead className="px-4 py-3">Status</TableHead>
            <TableHead className="px-4 py-3">Received</TableHead>
            <TableHead className="px-4 py-3 text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inbox.map((message) => {
            const status = message.read_at ? 'Read' : 'Unread';

            return (
              <TableRow key={message.id}>
                <TableCell className="px-4 py-3 font-medium truncate">{message.title}</TableCell>
                <TableCell className="px-4 py-3 max-w-xs text-muted-foreground truncate">
                  {message.body ?? 'No message body'}
                </TableCell>
                <TableCell className="px-4 py-3">{status}</TableCell>
                <TableCell className="px-4 py-3 text-muted-foreground whitespace-nowrap">{message.created_at}</TableCell>
                <TableCell className="px-4 py-3 text-right">
                  {message.action_url ? (
                    <a
                      href={message.action_url}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {message.action_label ?? 'Open'}
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

const TemporaryDashboard: InertiaPageWithLayout = () => {
  const { user, inbox } = usePage<PageProps>().props;

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-10">
      <Head title="TemporaryDashboard" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-3 rounded-2xl ">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Dashboard</p>
            <h1 className="text-3xl font-semibold tracking-tight">Welcome, {user.name}</h1>
            <pre>{JSON.stringify(user, null, 2)}</pre>
            <p className="mt-2 text-sm text-muted-foreground">Here is your inbox overview.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => { router.post(logout.url()); }}>
              Logout
            </Button>
          </div>
        </div>

        <InboxBuilder inbox={inbox} />
      </div>
    </div>
  );
}

export default TemporaryDashboard;
