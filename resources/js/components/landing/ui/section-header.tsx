import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const sectionHeaderVariants = cva('flex flex-col', {
    variants: {
        align: {
            left: 'items-start text-left',
            center: 'items-center text-center',
        },
        size: {
            compact: 'gap-3',
            default: 'gap-4',
            large: 'gap-5',
        },
    },
    defaultVariants: { align: 'left', size: 'default' },
});

export interface SectionHeaderProps
    extends
        React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof sectionHeaderVariants> {
    badge?: React.ReactNode;
    heading: React.ReactNode;
    description?: React.ReactNode;
    action?: React.ReactNode;
}

function SectionHeader({
    className,
    align = 'left',
    size = 'default',
    badge,
    heading,
    description,
    action,
    ...props
}: SectionHeaderProps) {
    return (
        <div
            className={cn(
                'mb-11 flex flex-col gap-7 sm:mb-14',
                align === 'center'
                    ? 'items-center text-center'
                    : 'md:flex-row md:items-end md:justify-between',
                className,
            )}
            {...props}
        >
            <div
                className={cn(
                    sectionHeaderVariants({ align, size }),
                    'max-w-3xl',
                )}
            >
                {badge && (
                    <Badge variant="accent" size="lg">
                        {badge}
                    </Badge>
                )}
                <h2
                    className={cn(
                        'font-extrabold tracking-[-0.045em] text-balance',
                        size === 'large'
                            ? 'text-4xl leading-[1.06] sm:text-5xl lg:text-[3.5rem]'
                            : 'text-3xl leading-[1.1] sm:text-4xl lg:text-5xl',
                    )}
                >
                    {heading}
                </h2>
                {description && (
                    <p className="max-w-2xl text-base leading-7 text-pretty text-muted-foreground sm:text-lg sm:leading-8">
                        {description}
                    </p>
                )}
            </div>
            {action && (
                <div
                    className={cn(
                        'flex shrink-0',
                        align === 'center' && 'justify-center',
                    )}
                >
                    {action}
                </div>
            )}
        </div>
    );
}

export { SectionHeader };
