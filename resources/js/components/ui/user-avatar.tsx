import { User as UserIcon } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import asset from '@/lib/assets';

type UserAvatarProps = {
  user: {
    name: string;
    avatar_url?: string;
    avatar?: string;
  };
  className?: string;
  size?: 'sm' | 'lg';
  fallbackType?: 'initials' | 'icon' | 'text' | 'default';
};

const sizeClasses = {
  sm: 'size-8',
  lg: 'size-28',
};

const initialsSizes = {
  sm: 'text-sm',
  lg: 'text-xl font-bold',
};

const iconSizes = {
  sm: 'size-4',
  lg: 'size-8',
};

const textSizes = {
  sm: 'hidden',
  lg: 'text-xs font-medium text-neutral-500 dark:text-neutral-400 select-none',
};

export function UserAvatar({
  user,
  className,
  size,
  fallbackType = 'default',
}: UserAvatarProps) {
  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const src = user.avatar_url || user.avatar;
  const sizeKey = size || 'sm';

  return (
    <Avatar className={cn(size && sizeClasses[size], className)}>
      <AvatarImage
        src={src || undefined}
        alt={user.name}
        className="object-cover"
      />
      <AvatarFallback
        className={cn(
          'flex h-full w-full flex-col items-center justify-center bg-secondary text-secondary-foreground',
          initialsSizes[sizeKey],
        )}
      >
        {fallbackType === 'text' && (
          <div className="flex flex-col items-center justify-center gap-1.5 text-muted-foreground select-none">
            <UserIcon className={cn('text-neutral-400 dark:text-neutral-500', iconSizes[sizeKey])} />
            <span className={textSizes[sizeKey]}>Belum ada foto</span>
          </div>
        )}
        {fallbackType === 'icon' && (
          <UserIcon className={cn('text-muted-foreground', iconSizes[sizeKey])} />
        )}
        {fallbackType === 'initials' && initials}
        {fallbackType === 'default' && (
          <img
            src={asset('avatars/default_avatar.jpg')}
            alt="Default Avatar"
            className="object-cover h-full w-full rounded-full"
          />
        )}
      </AvatarFallback>
    </Avatar>
  );
}
export default UserAvatar;
