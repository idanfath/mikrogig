import { Link } from '@inertiajs/react';
import { Menu, X } from 'lucide-react';
import * as React from 'react';

import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';
import { home, login, register } from '@/routes';

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
            <a
                href="#konten-utama"
                className="fixed top-3 left-3 z-[70] -translate-y-24 rounded-lg bg-foreground px-4 py-2 text-sm font-bold text-background transition-transform focus:translate-y-0"
            >
                Lewati ke konten utama
            </a>

            <header
                className={cn(
                    'sticky top-0 z-50 border-b border-border/80 bg-background/88 backdrop-blur-xl',
                    className,
                )}
            >
                <Container className="flex h-[4.5rem] items-center justify-between gap-5">
                    <Link
                        href={home.url()}
                        aria-label="MikroGig, kembali ke beranda"
                        className="rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/25"
                    >
                        <Logo />
                    </Link>

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
                        <Button asChild variant="ghost">
                            <Link href={login.url()}>Masuk</Link>
                        </Button>
                        <Button asChild>
                            <Link href={register.url()}>Daftar gratis</Link>
                        </Button>
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
                        <nav
                            aria-label="Navigasi seluler"
                            className="flex flex-col gap-1"
                        >
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
                        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-5">
                            <Button asChild variant="outline" size="lg">
                                <Link
                                    href={login.url()}
                                    onClick={() => setOpen(false)}
                                >
                                    Masuk
                                </Link>
                            </Button>
                            <Button asChild size="lg">
                                <Link
                                    href={register.url()}
                                    onClick={() => setOpen(false)}
                                >
                                    Daftar
                                </Link>
                            </Button>
                        </div>
                    </Container>
                </div>
            </header>
        </>
    );
}

export { Navbar };
