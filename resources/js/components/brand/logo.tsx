import * as React from 'react';
import asset from '@/lib/assets';
import { cn } from '@/lib/utils';

interface LogoProps extends React.ComponentProps<'a'> {
  imageClassName?: string;
  type?: 'full' | 'small';
  size?: 'small' | 'medium' | 'large';
}

function Logo({
  className,
  imageClassName,
  type = 'full',
  size = 'medium',
  ...props
}: LogoProps) {
  const sizeClass = {
    small: 'h-6 w-auto',
    medium: 'h-8 w-auto',
    large: 'h-10 w-auto',
  };

  return (
    <a className={cn('flex select-none', className)} href="/" {...props}>
      {type === 'full' ? (
        <img
          src={asset('assets/logo/logo.svg')}
          alt="Mikrogig Logo"
          className={cn(sizeClass[size], imageClassName)}
        />
      ) : (
        <img
          src={asset('assets/logo/logo_small.svg')}
          alt="Mikrogig Logo"
          className={cn(sizeClass[size], imageClassName)}
        />
      )}
    </a>
  );
}

export { Logo };
