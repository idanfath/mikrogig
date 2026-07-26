import { Badge } from '@/components/ui/badge';
import type { Profile } from '../types';

type ProfileDetailsProps = {
  profile: Profile;
  isOwner: boolean;
};

function ProfileDetails({ profile, isOwner }: ProfileDetailsProps) {
  const hasBio = Boolean(profile.freelancer_profile?.bio);
  const hasSkills = Boolean(
    profile.freelancer_profile?.skills &&
      profile.freelancer_profile.skills.length > 0,
  );

  if (!hasBio && !hasSkills && !isOwner) {
    return (
      <p className="pt-2 text-sm text-muted-foreground">
        Belum ada detail profil.
      </p>
    );
  }

  if (!hasBio && !hasSkills) {
    return null;
  }

  return (
    <div className="flex flex-col gap-5 pt-3 border-t border-border/60 text-sm">
      {hasBio && (
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tentang Saya
          </h2>
          <div className="rounded-xl bg-secondary/60 p-4 border border-border/40 text-foreground leading-relaxed whitespace-pre-wrap">
            {profile.freelancer_profile?.bio}
          </div>
        </div>
      )}

      {hasSkills && (
        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Keahlian & Keterampilan
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {profile.freelancer_profile?.skills.map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className="px-3 py-1 font-medium text-xs rounded-lg"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { ProfileDetails };
