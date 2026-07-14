import type Echo from 'laravel-echo';
import type Pusher from 'pusher-js';
import type { Auth } from '@/types/auth';

declare global {
    interface Window {
        Pusher: typeof Pusher;
        Echo: Echo;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}
