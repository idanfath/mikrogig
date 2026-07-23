import { Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { capitalize } from '@/lib/utils';
import { UserRoleFrontendLabel } from '@/types/enum';
import type { Profile } from '../types';
import { PrivacyTooltip } from './privacy-tooltip';

type ProfileHeaderProps = {
  profile: Profile;
  avatarUrl?: string;
  isOwner: boolean;
  editing: boolean;
  onEdit: () => void;
};

function ProfileHeader({
  profile,
  avatarUrl,
  isOwner,
  editing,
  onEdit,
}: ProfileHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-center gap-4">
        <UserAvatar
          user={{ name: profile.name, avatar_url: avatarUrl }}
          size="lg"
        />
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold">{profile.name}</h1>
            <Badge>{UserRoleFrontendLabel[profile.role]}</Badge>
          </div>
          {profile.location && (
            <p className="text-sm text-muted-foreground">
              {capitalize(profile.location, true)}
            </p>
          )}
          {isOwner && profile.email && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>{profile.email}</span>
              <PrivacyTooltip />
            </div>
          )}
        </div>
      </div>
      {isOwner && !editing && (
        <Button type="button" onClick={onEdit} className="w-full sm:w-auto">
          <Pencil data-icon="inline-start" />
          Edit profil
        </Button>
      )}
    </div>
  );
}

export { ProfileHeader };
