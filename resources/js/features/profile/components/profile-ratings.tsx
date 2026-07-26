import { Star } from 'lucide-react';
import { UserAvatar } from '@/components/ui/user-avatar';
import type { Profile } from '@/features/profile/types';
import { formatDate } from '@/lib/date';

export function ProfileRatings({
  ratingSummary,
}: {
  ratingSummary: Profile['rating_summary'];
}) {
  return (
    <section className="rounded-2xl border bg-card p-6 shadow-xs">
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-border/60">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Rating & Ulasan</h2>
          <p className="text-xs text-muted-foreground">
            {ratingSummary.count > 0
              ? `Berdasarkan ${ratingSummary.count} ulasan`
              : 'Belum ada ulasan'}
          </p>
        </div>
        {ratingSummary.count > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-warning/15 px-3 py-1 text-sm font-semibold text-warning-foreground">
            <Star className="size-4 fill-warning text-warning" />
            <span>{ratingSummary.average}</span>
            <span className="text-xs text-muted-foreground font-normal">
              ({ratingSummary.count})
            </span>
          </div>
        )}
      </div>

      {ratingSummary.latest.length === 0 ? (
        <p className="pt-4 text-sm text-muted-foreground">Belum ada rating yang tersedia.</p>
      ) : (
        <div className="flex flex-col divide-y divide-border/60">
          {ratingSummary.latest.map((rating) => (
            <article key={rating.id} className="flex flex-col gap-2.5 py-4 first:pt-4 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <UserAvatar user={rating.author} size="sm" />
                  <div>
                    <p className="text-sm font-medium leading-none">{rating.author.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(rating.created_at, 'dd MMM yyyy')} · {rating.gig.title}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`size-3.5 ${
                        star <= rating.score
                          ? 'fill-warning text-warning'
                          : 'fill-muted/30 text-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {rating.comment && (
                <div className="rounded-2xl rounded-tl-xs bg-muted/40 p-3.5 text-sm leading-relaxed text-foreground border border-border/50">
                  <p>"{rating.comment}"</p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
