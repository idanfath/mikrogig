import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    WageBenchmarkStatus,
    getGigEstimatedDurationLabel,
    getWageBenchmarkStatusLabel,
    getWageBenchmarkStatusVariant,
} from '@/types/enum';
import type {
    GigEstimatedDuration,
    WageBenchmarkStatus as WageBenchmarkStatusType,
} from '@/types/enum';
import type { WageBenchmarkContext, WageBenchmarkRange } from '../types';

export function classifyWageBenchmark(
    amount: number,
    range: WageBenchmarkRange,
): WageBenchmarkStatusType {
    if (amount < range.minimum) {
        return WageBenchmarkStatus.Below;
    }

    if (amount < range.maximum) {
        return WageBenchmarkStatus.Within;
    }

    return WageBenchmarkStatus.Meets;
}

export function WageBenchmarkBadge({
    status,
}: {
    status: WageBenchmarkStatusType;
}) {
    return (
        <Badge variant={getWageBenchmarkStatusVariant(status)} size="sm">
            {getWageBenchmarkStatusLabel(status)}
        </Badge>
    );
}

export function WageBenchmark({
    duration,
    range,
    context,
    status,
    className,
    showDisclaimer = false,
}: {
    duration: GigEstimatedDuration;
    range: WageBenchmarkRange;
    context?: Pick<WageBenchmarkContext, 'year' | 'source'>;
    status?: WageBenchmarkStatusType;
    className?: string;
    showDisclaimer?: boolean;
}) {
    const isSingleValue = range.minimum === range.maximum;

    return (
        <div
            className={cn(
                'flex flex-col gap-2 rounded-xl border border-border/50 bg-secondary/30 p-3.5 text-xs',
                status === WageBenchmarkStatus.Below &&
                    'border-destructive/30 bg-destructive/5',
                className,
            )}
        >
            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-foreground">
                    Acuan Upah MikroGig berdasarkan UMP
                </span>
                {status && <WageBenchmarkBadge status={status} />}
            </div>
            <p className="text-muted-foreground">
                {getGigEstimatedDurationLabel(duration)}:{' '}
                <strong className="text-foreground">
                    {isSingleValue
                        ? `Rp${range.minimum.toLocaleString('id-ID')}`
                        : `Rp${range.minimum.toLocaleString('id-ID')}–Rp${range.maximum.toLocaleString('id-ID')}`}
                </strong>
            </p>
            {status === WageBenchmarkStatus.Below && (
                <p className="font-medium text-destructive">
                    Nilai ini berada di bawah acuan minimum. Anda tetap dapat
                    melanjutkan.
                </p>
            )}
            {context && (
                <p className="text-muted-foreground">
                    Data UMP {context.year} dari{' '}
                    <a
                        href={context.source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={context.source.title}
                        className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                        {context.source.publisher}
                    </a>
                    .
                </p>
            )}
            {showDisclaimer && (
                <p className="leading-relaxed text-muted-foreground">
                    Acuan ini bukan ketentuan upah minimum legal dan belum
                    mencakup material, transportasi, kompleksitas, atau
                    kebutuhan khusus.
                </p>
            )}
        </div>
    );
}
