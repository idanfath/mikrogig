import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { AvatarActions } from '@/features/profile/components/avatar-actions';
import { useAvatarSelection } from '@/features/profile/hooks/use-avatar-selection';
import onboarding from '@/routes/onboarding';
import { UserRoleFrontendLabel } from '@/types/enum';
import type { OnboardingAvatarPageProps } from '../types';

export function AvatarStep({ auth }: OnboardingAvatarPageProps) {
  const form = useForm({ avatar: null as File | null });
  const hasCustomAvatar = Boolean(
    auth.user.avatar && !auth.user.avatar.includes('default_avatar'),
  );
  const avatarSelection = useAvatarSelection({
    existingUrl: hasCustomAvatar ? auth.user.avatar_url : undefined,
    onFileChange: (avatar) => form.setData('avatar', avatar),
  });

  const clearNewSelection = () => {
    form.setData('avatar', null);
    avatarSelection.clearSelection();
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();

    if (form.data.avatar) {
      form.post(onboarding.avatar.url(), {
        onSuccess: avatarSelection.clearSelection,
      });

      return;
    }

    if (hasCustomAvatar) {
      form.post(onboarding.skip.url());
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-1 flex-col items-center gap-4">
      <div className="flex w-full max-w-xl flex-col items-center gap-4 rounded-2xl border border-neutral-100 bg-white p-8 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex gap-4">
          <UserAvatar
            user={{
              name: auth.user.name,
              avatar_url: avatarSelection.displayedUrl,
            }}
            size="lg"
          />
          <div className="flex h-full flex-col gap-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                {auth.user.name}
              </p>
              <Badge variant="default" className="text-xs">
                {UserRoleFrontendLabel[auth.user.role]}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{auth.user.email}</p>
            <div className="mt-1 h-4 w-32 rounded bg-neutral-100 dark:bg-neutral-700" />
            <div className="mt-1 h-4 w-full rounded bg-neutral-100 dark:bg-neutral-700" />
          </div>
        </div>

        <AvatarActions
          fileInputRef={avatarSelection.inputRef}
          processing={form.processing}
          hasAvatar={Boolean(avatarSelection.displayedUrl)}
          canRemove={avatarSelection.hasSelection}
          onSelect={avatarSelection.handleFileChange}
          onRemove={clearNewSelection}
        />

        <p className="max-w-sm text-center text-xs leading-relaxed text-muted-foreground select-none">
          Pastikan wajah terlihat jelas. Ukuran maksimal 2MB. Foto profil kamu
          bisa diubah kapan saja di pengaturan akun.
        </p>
      </div>

      <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          mobileLarge
          className="w-full sm:w-auto"
          onClick={() => form.post(onboarding.skip.url())}
          disabled={form.processing}
        >
          Nanti Saja
        </Button>
        <Button
          type="submit"
          mobileLarge
          className="w-full sm:w-auto"
          disabled={form.processing || (!form.data.avatar && !hasCustomAvatar)}
        >
          {form.processing ? 'Menyimpan...' : 'Terapkan'}
        </Button>
      </div>
    </form>
  );
}
