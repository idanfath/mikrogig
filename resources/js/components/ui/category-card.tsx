import * as React from 'react';
import { ArrowUpRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Avatar } from './avatar';

interface CategoryCardProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'title'> {
  icon: React.ReactNode;
  title: string;
  jobs?: number;
  meta?: React.ReactNode;
  href: string;
}

function CategoryCard({ icon, title, jobs, meta, href, className, ...props }: CategoryCardProps) {
  return (
    <a
      href={href}
      className={cn(
        'group relative flex min-h-44  flex-col overflow-hidden rounded-[1.35rem] border border-border bg-card p-5 outline-none transition-[transform,border-color,box-shadow] duration-500 hover:border-primary/35 hover:shadow-lg focus-visible:ring-3 focus-visible:ring-ring/25',
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-4">
        <Avatar className="flex items-center justify-center size-10 bg-accent text-primary transition-colors duration-500 group-hover:bg-primary group-hover:text-white">
          {icon}
        </Avatar>
        <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" aria-hidden="true" />
      </div>
      <div className="pt-4">
        <h3 className="font-extrabold tracking-[-0.02em]">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {meta ?? (jobs !== undefined ? `${jobs.toLocaleString('id-ID')} gig tersedia` : 'Lihat kebutuhan terdekat')}
        </p>
      </div>
    </a>
  );
}

export { CategoryCard };
