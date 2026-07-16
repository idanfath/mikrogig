import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const logoVariants = cva('group inline-flex items-center font-bold select-none', {
    variants: {
        size: {
            sm: 'gap-2 text-sm',
            md: 'gap-2.5 text-base',
            lg: 'gap-3 text-xl',
            xl: 'gap-3.5 text-2xl',
        },
        tone: {
            default: 'text-foreground',
            inverse: 'text-white',
        },
    },
    defaultVariants: { size: 'md', tone: 'default' },
});

const markSizes = { sm: 'size-8', md: 'size-9', lg: 'size-11', xl: 'size-13' } as const;

export interface LogoProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof logoVariants> {
    iconOnly?: boolean;
}

function Logo({ className, size = 'md', tone = 'default', iconOnly = false, ...props }: LogoProps) {
    return (
        <div className={cn(logoVariants({ size, tone }), className)} {...props}>
            <span
                className={cn(
                    'grid shrink-0 place-items-center rounded-xl bg-brand text-white shadow-[0_8px_24px_-12px_rgb(232_114_12/0.95)] transition-transform duration-200 group-hover:-rotate-3',
                    markSizes[size ?? 'md'],
                )}
                aria-hidden="true"
            >
                <svg viewBox="0 0 32 32" fill="none" className="size-[58%]">
                    <path d="M7 17.5 12.5 12l4 4L22 10.5l3 3-8.5 8.5-4-4-2.5 2.5L7 17.5Z" fill="currentColor" />
                    <path d="M7.5 8.5h8M20.5 23.5h4" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
                </svg>
            </span>

            {!iconOnly && (
                <span className="flex flex-col leading-none">
                    <span className="tracking-[-0.04em]">
                        Mikro<span className="text-brand">Gig</span>
                    </span>
                    <span className={cn('mt-1 text-[10px] font-semibold tracking-normal', tone === 'inverse' ? 'text-white/55' : 'text-muted-foreground')}>
                        Kerja aman, upah adil
                    </span>
                </span>
            )}
        </div>
    );
}

export { Logo };
