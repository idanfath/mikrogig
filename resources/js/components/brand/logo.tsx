import * as React from 'react';
import { Link } from '@inertiajs/react';
import asset from '@/lib/assets';
import { cn } from '@/lib/utils';
import { home } from '@/routes';

interface LogoProps extends Omit<React.ComponentProps<typeof Link>, 'size'> {
    imageClassName?: string;
    type?: 'full' | 'small';
    size?: 'small' | 'medium' | 'large';
    tone?: 'default' | 'inverse';
}

function Logo({
    className,
    imageClassName,
    type = 'full',
    size = 'medium',
    tone = 'default',
    href = home.url(),
    ...props
}: LogoProps) {
    const sizeClass = {
        small: 'h-6 w-auto',
        medium: 'h-8 w-auto',
        large: 'h-10 w-auto',
    };

    return (
        <Link
            className={cn('flex select-none', className)}
            href={href}
            {...props}
        >
            {type === 'full' ? (
                <img
                    src={asset('assets/logo/logo.svg')}
                    alt="Mikrogig Logo"
                    className={cn(
                        sizeClass[size],
                        tone === 'inverse' && 'brightness-0 invert',
                        imageClassName,
                    )}
                />
            ) : (
                <img
                    src={asset('assets/logo/logo_small.svg')}
                    alt="Mikrogig Logo"
                    className={cn(
                        sizeClass[size],
                        tone === 'inverse' && 'brightness-0 invert',
                        imageClassName,
                    )}
                />
            )}
        </Link>
    );
}

export { Logo };
