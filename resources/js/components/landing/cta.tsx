import { Link } from '@inertiajs/react';
import {
  ArrowRight,
  BriefcaseBusiness,
  Search,
  ShieldCheck,
} from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Section } from './ui/section';
import { cn } from '@/lib/utils';
import { login, register } from '@/routes';
import { Badge } from '../ui/badge';

interface CTAAction {
  label: string;
  href: string;
}

interface CTAProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  badge?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  primaryAction?: CTAAction;
  secondaryAction?: CTAAction;
}

function CTA({
  badge = 'Mulai dari peranmu',
  title = 'Satu platform. Dua sisi yang sama-sama terlindungi.',
  description = 'Buat akun sebagai pekerja atau pemberi kerja. Alur onboarding akan menyesuaikan kebutuhanmu.',
  primaryAction = { label: 'Saya ingin mencari gig', href: register.url() },
  secondaryAction = {
    label: 'Saya ingin mencari pekerja',
    href: register.url(),
  },
  className,
  ...props
}: CTAProps) {
  return (
    <Section
      id="mulai"
      spacing="sm"
      className={cn('pb-20 sm:pb-24 lg:pb-28', className)}
      {...props}
    >
      <div className="relative isolate overflow-hidden rounded-[2rem] bg-foreground px-5 py-8 text-background shadow-lg sm:px-8 sm:py-10 lg:px-12 lg:py-12">
        <div className="pointer-events-none absolute -top-40 -right-32 -z-10 size-96 rounded-full bg-primary/25 blur-3xl" />
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <Badge variant="dark" size="xl">
              <ShieldCheck
                className="size-3.5 text-primary"
                aria-hidden="true"
              />
              {badge}
            </Badge>
            <h2 className="mt-5 text-3xl leading-[1.05] font-extrabold tracking-tighter text-balance text-white sm:text-4xl lg:text-5xl">
              {title}
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-pretty text-white/58 sm:text-base">
              {description}
            </p>
            <p className="mt-6 text-xs text-white/45">
              Sudah punya akun?{' '}
              <Link
                href={login.url()}
                className="font-bold text-primary hover:text-white"
              >
                Masuk di sini
              </Link>
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <RoleAction
              icon={<Search className="size-5" />}
              title="Untuk pekerja"
              description="Bangun profil, temukan gig dekat rumah, dan lindungi pembayaranmu."
              action={primaryAction}
              primary
            />
            <RoleAction
              icon={<BriefcaseBusiness className="size-5" />}
              title="Untuk pemberi kerja"
              description="Temukan tenaga tepercaya dengan ruang lingkup dan biaya yang jelas."
              action={secondaryAction}
            />
          </div>
        </div>
      </div>
    </Section>
  );
}

function RoleAction({
  icon,
  title,
  description,
  action,
  primary = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: CTAAction;
  primary?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl border p-5',
        primary
          ? 'border-primary/30 bg-primary/12'
          : 'border-white/10 bg-white/6',
      )}
    >
      <span
        className={cn(
          'grid size-10 place-items-center rounded-xl',
          primary
            ? 'bg-primary text-white'
            : 'bg-white/10 text-primary',
        )}
        aria-hidden="true"
      >
        {icon}
      </span>
      <h3 className="mt-5 font-extrabold text-white">{title}</h3>
      <p className="mt-2 flex-1 text-xs leading-5 text-white/52">
        {description}
      </p>
      <Button
        asChild
        variant={primary ? 'default' : 'secondary'}
        size="lg"
        className="mt-5 w-full"
      >
        <Link href={action.href}>
          {action.label}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </Button>
    </div>
  );
}

export { CTA };
