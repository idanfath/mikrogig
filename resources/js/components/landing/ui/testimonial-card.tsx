import * as React from 'react';
import { ArrowRight } from 'lucide-react';

import { cn } from '@/lib/utils';

interface TestimonialCardProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'title'
> {
  name: string;
  role: string;
  message: string;
  avatar?: string;
  rating?: number;
  eyebrow?: string;
  outcome?: string;
  icon?: React.ReactNode;
}

function TestimonialCard({
  name,
  role,
  message,
  avatar,
  rating,
  eyebrow = 'Skenario pengguna',
  outcome,
  icon,
  className,
  ...props
}: TestimonialCardProps) {
  return (
    <article
      className={cn(
        'flex h-full flex-col rounded-[1.5rem] border border-border bg-card p-6 sm:p-7',
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="text-[11px] font-extrabold tracking-[0.08em] text-primary uppercase">
          {eyebrow}
        </span>
        {icon && (
          <span className="grid size-9 place-items-center rounded-xl bg-accent text-primary">
            {icon}
          </span>
        )}
      </div>
      {rating !== undefined && (
        <span className="sr-only">Rating {rating} dari 5</span>
      )}
      <p className="mt-6 flex-1 text-base leading-7 font-semibold text-foreground">
        {message}
      </p>
      {outcome && (
        <div className="mt-6 flex items-start gap-2 rounded-xl bg-success-soft p-3 text-xs leading-5 text-success">
          <ArrowRight className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>{outcome}</span>
        </div>
      )}
      <div className="mt-6 flex items-center gap-3 border-t border-border pt-5">
        {avatar ? (
          <img
            src={avatar}
            alt=""
            className="size-10 rounded-full border border-border object-cover"
          />
        ) : (
          <div
            className="grid size-10 place-items-center rounded-full bg-secondary text-xs font-extrabold text-foreground"
            aria-hidden="true"
          >
            {name
              .split(' ')
              .map((word) => word[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-sm font-extrabold">{name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{role}</p>
        </div>
      </div>
    </article>
  );
}

export { TestimonialCard };
