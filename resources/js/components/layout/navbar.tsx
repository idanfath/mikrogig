import { Link, usePage } from '@inertiajs/react';
import { Menu, X } from 'lucide-react';
import * as React from 'react';

import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand/logo';
import { cn } from '@/lib/utils';
import { home, login, register } from '@/routes';
import app from '@/routes/app';

interface NavItem {
  label: string;
  href: string;
}

interface NavbarProps {
  items?: NavItem[];
  className?: string;
}

const defaultItems: NavItem[] = [
  { label: 'Cara kerja', href: '#how-it-works' },
  { label: 'Pilihan pekerjaan', href: '#categories' },
  { label: 'Perlindungan upah', href: '#fair-wage' },
  { label: 'Akses AI', href: '#ai-features' },
  { label: 'Tanya jawab', href: '#faq' },
];

function Navbar({ items = defaultItems, className }: NavbarProps) {
  const [open, setOpen] = React.useState(false);
  const menuId = React.useId();
  const { auth } = usePage<any>().props;
  const user = auth?.user;

  React.useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', closeOnEscape);

    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 border-b border-border/80 bg-background/88 backdrop-blur-xl',
          className,
        )}
      >
        <Container className="flex h-[4.5rem] items-center justify-between gap-5">
          <Logo
            href={home.url()}
            aria-label="MikroGig, kembali ke beranda"
            className="rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/25"
          />

          <nav
            aria-label="Navigasi utama"
            className="hidden items-center gap-1 lg:flex"
          >
            {items.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/25 focus-visible:outline-none"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            {user ? (
              <Button asChild>
                <Link href={app.home.url()}>Masuk ke Aplikasi</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href={login.url()}>Masuk</Link>
                </Button>
                <Button asChild>
                  <Link href={register.url()}>Daftar gratis</Link>
                </Button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="grid size-11 place-items-center rounded-xl border border-border bg-card text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/25 lg:hidden"
            aria-label={open ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={open}
            aria-controls={menuId}
          >
            {open ? (
              <X className="size-5" aria-hidden="true" />
            ) : (
              <Menu className="size-5" aria-hidden="true" />
            )}
          </button>
        </Container>

        <div
          id={menuId}
          hidden={!open}
          className="border-t border-border bg-background lg:hidden"
        >
          <Container className="py-5">
            <nav aria-label="Navigasi seluler" className="flex flex-col gap-1">
              {items.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-3 text-sm font-bold text-foreground hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/25 focus-visible:outline-none"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            {user ? (
              <div className="mt-4 border-t border-border pt-5">
                <Button asChild size="lg" className="w-full">
                  <Link href={app.home.url()} onClick={() => setOpen(false)}>
                    Masuk ke Aplikasi
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-5">
                <Button asChild variant="outline" size="lg">
                  <Link href={login.url()} onClick={() => setOpen(false)}>
                    Masuk
                  </Link>
                </Button>
                <Button asChild size="lg">
                  <Link href={register.url()} onClick={() => setOpen(false)}>
                    Daftar
                  </Link>
                </Button>
              </div>
            )}
          </Container>
        </div>
      </header>
    </>
  );
}

export { Navbar };
