import { cva } from 'class-variance-authority';
import type { VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const containerVariants = cva('mx-auto w-full', {
    variants: {
        size: {
            sm: 'max-w-3xl',
            md: 'max-w-5xl',
            lg: 'max-w-6xl',
            xl: 'max-w-[1240px]',
            full: 'max-w-none',
        },
        padding: {
            none: '',
            sm: 'px-4 sm:px-5',
            default: 'px-5 sm:px-7 lg:px-10',
            lg: 'px-6 sm:px-9 lg:px-12',
        },
    },
    defaultVariants: {
        size: 'xl',
        padding: 'default',
    },
});

export interface ContainerProps
    extends
        React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof containerVariants> {}

function Container({ className, size, padding, ...props }: ContainerProps) {
    return (
        <div
            data-slot="container"
            className={cn(containerVariants({ size, padding }), className)}
            {...props}
        />
    );
}

export { Container, containerVariants };
