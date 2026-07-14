import * as React from 'react';
import logo from '@/assets/logo.svg';
import logo_small from '@/assets/logo_small.svg';
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
          src={logo}
          alt="Mikrogig Logo"
          className={cn(sizeClass[size], imageClassName)}
        />
      ) : (
        <img
          src={logo_small}
          alt="Mikrogig Logo"
          className={cn(sizeClass[size], imageClassName)}
        />
      )}
    </a>
  );
}

export { Logo };
