import { Head, usePage } from '@inertiajs/react';
import {
    useEffect
    
    
    
} from 'react';
import type {PropsWithChildren, ReactElement, ReactNode} from 'react';
import toast, { Toaster } from 'react-hot-toast';

export default function Layout({ children }: PropsWithChildren) {
    const { flash } = usePage().props as any;
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success, { position: 'top-center' });
        }

        if (flash?.error) {
            toast.error(flash.error, { position: 'top-center' });
        }

        if (flash?.message) {
            toast(flash.message, { position: 'top-center' });
        }
    }, [flash]);

    return (
        <div>
            <Toaster position="top-center" reverseOrder={false} />
            <main>{children}</main>
        </div>
    );
}
