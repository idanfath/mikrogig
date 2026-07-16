import toast from 'react-hot-toast';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Eye, X, ExternalLink } from 'lucide-react';

export function showNotificationToast(e: {
    id: number;
    title: string;
    body?: string | null;
    action_url?: string | null;
    action_label?: string | null;
}) {
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
                            {e.body.length > 90
                                ? e.body.substring(0, 90) + '...'
                                : e.body}
                        </p>
                    )}
                    <div className="mt-3 flex gap-2">
                        <Button
                            size="sm"
                            className="font-semibold"
                            onClick={() => {
                                toast.dismiss(t.id);
                                router.visit(`/app/notifications?open=${e.id}`);
                            }}
                        >
                            <Eye data-icon="inline-start" />
                            Lihat
                        </Button>

                        {e.action_url && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="font-semibold"
                                onClick={() => {
                                    toast.dismiss(t.id);
                                    router.visit(e.action_url!);
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
