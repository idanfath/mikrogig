import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import type { Paginated } from '../types';

export function Pagination<T>({ page }: { page: Paginated<T> }) {
    // temporary patch, without this opening the page throws: Uncaught TypeError: page.links.find is not a function
    if (!page || !Array.isArray(page.links)) {
        return null;
    }

    const previous = page.links.find((link) => link.label.includes('Previous'));
    const next = page.links.find((link) => link.label.includes('Next'));

    if (!previous && !next) {
        return null;
    }

    return (
        <div className="flex justify-between gap-3">
            <Button asChild variant="outline" disabled={!previous?.url}>
                <Link href={previous?.url ?? '#'} preserveScroll>
                    ← Sebelumnya
                </Link>
            </Button>
            <Button asChild variant="outline" disabled={!next?.url}>
                <Link href={next?.url ?? '#'} preserveScroll>
                    Berikutnya →
                </Link>
            </Button>
        </div>
    );
}
