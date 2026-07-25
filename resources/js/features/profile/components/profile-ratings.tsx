import { Star } from 'lucide-react';
import type { Profile } from '@/features/profile/types';

export function ProfileRatings({
  ratingSummary,
}: {
  ratingSummary: Profile['rating_summary'];
}) {
  return (
    <section className="rounded-2xl border bg-card p-6 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">Rating</h2>
        {ratingSummary.count > 0 && (
          <span className="flex items-center gap-1 text-sm font-medium">
            <Star className="size-4 fill-current text-warning" />
            {ratingSummary.average} ({ratingSummary.count})
          </span>
        )}
      </div>

      {ratingSummary.latest.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Belum ada rating</p>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          {ratingSummary.latest.map((rating) => (
            <article
              key={rating.id}
              className="flex flex-col gap-2 border-t pt-4 first:border-t-0 first:pt-0"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{rating.author.name}</p>
                <span className="text-sm text-muted-foreground">
                  {rating.score}/5 ·{' '}
                  {new Intl.DateTimeFormat('id-ID', {
                    dateStyle: 'medium',
                  }).format(new Date(rating.created_at))}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Gig: {rating.gig.title}
              </p>
              {rating.comment && <p className="text-sm">{rating.comment}</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
