import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { PrivacyTooltip } from '@/components/profile/privacy-tooltip';
import type { Profile } from '@/components/profile/types';
import { Badge } from '@/components/ui/badge';

type ProfileDetailsProps = {
  profile: Profile;
  isOwner: boolean;
};

function ProfileDetails({ profile, isOwner }: ProfileDetailsProps) {
  return (
    <div className="flex flex-col gap-4 text-sm">
      {isOwner && (
        <div>
          <div className="flex items-center gap-1">
            <p className="text-muted-foreground">Tanggal lahir</p>
            <PrivacyTooltip />
          </div>
          <p>
            {profile.date_of_birth
              ? format(new Date(profile.date_of_birth), 'dd MMMM yyyy', {
                locale: id,
              })
              : '-'}
          </p>
        </div>
      )}
      {profile.freelancer_profile && (
        <>
          <div>
            <p className="text-muted-foreground">Judul profil</p>
            <p>{profile.freelancer_profile.title || '-'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Bio</p>
            <p className="whitespace-pre-wrap">
              {profile.freelancer_profile.bio || '-'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.freelancer_profile.skills.map((skill) => (
              <Badge key={skill} variant="secondary">
                {skill}
              </Badge>
            ))}
          </div>
        </>
      )}
      {!isOwner && !profile.freelancer_profile && (
        <p className="text-muted-foreground">Belum ada detail profil.</p>
      )}
    </div>
  );
}

export { ProfileDetails };
