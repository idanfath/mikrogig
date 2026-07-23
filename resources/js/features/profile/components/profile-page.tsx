import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { AppPage, AppPageCard } from '@/components/layout/app-page';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useProfileEnhance } from '@/features/profile/hooks/use-profile-enhance';
import type { ProfileForm, ProfilePageProps } from '@/features/profile/types';
import { useRegionSelect } from '@/features/regions/hooks/use-region-select';
import { useDetectLocation } from '@/features/regions/hooks/use-detect-location';
import app from '@/routes/app';
import { useAvatarSelection } from '../hooks/use-avatar-selection';
import { AvatarActions } from './avatar-actions';
import { BasicFields } from './basic-fields';
import { FreelancerFields } from './freelancer-fields';
import { ProfileDetails } from './profile-details';
import { ProfileHeader } from './profile-header';

export function ProfilePage({
  profile,
  is_owner,
  has_custom_avatar,
  max_date_of_birth,
}: ProfilePageProps) {
  const isFreelancer = profile.role === 'freelancer';
  const [editing, setEditing] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { detecting, detectLocation } = useDetectLocation();
  const form = useForm<ProfileForm>({
    name: profile.name,
    date_of_birth: profile.date_of_birth ?? '',
    province_id: profile.province_id ?? '',
    regency_id: profile.regency_id ?? '',
    title: profile.freelancer_profile?.title ?? '',
    bio: profile.freelancer_profile?.bio ?? '',
    skills: profile.freelancer_profile?.skills ?? [],
    avatar: null,
    remove_avatar: false,
  });
  const {
    provinces,
    regencies,
    loadingProvinces,
    loadingRegencies,
    selectedProvinceName,
    selectedRegencyName,
  } = useRegionSelect({
    provinceId: form.data.province_id,
    regencyId: form.data.regency_id,
    enabled: editing,
  });
  const enhanceLocation =
    selectedRegencyName && selectedProvinceName
      ? `${selectedRegencyName}, ${selectedProvinceName}`
      : (profile.location ?? '');
  const {
    availability,
    enhancingTitle,
    enhancingBio,
    enhancingSkills,
    enhance,
    enhanceSkills,
    resetLastEnhanced,
  } = useProfileEnhance({
    title: form.data.title,
    bio: form.data.bio,
    skills: form.data.skills,
    location: enhanceLocation,
    formProcessing: form.processing,
    onTitleChange: (value) => form.setData('title', value),
    onBioChange: (value) => form.setData('bio', value),
    onSkillsChange: (skills) => form.setData('skills', skills),
  });

  const existingAvatarUrl =
    has_custom_avatar && !form.data.remove_avatar
      ? profile.avatar_url
      : undefined;
  const avatarSelection = useAvatarSelection({
    existingUrl: existingAvatarUrl,
    onFileChange: (avatar) =>
      form.setData((data) => ({ ...data, avatar, remove_avatar: false })),
  });

  const resetForm = () => {
    form.setData({
      name: profile.name,
      date_of_birth: profile.date_of_birth ?? '',
      province_id: profile.province_id ?? '',
      regency_id: profile.regency_id ?? '',
      title: profile.freelancer_profile?.title ?? '',
      bio: profile.freelancer_profile?.bio ?? '',
      skills: profile.freelancer_profile?.skills ?? [],
      avatar: null,
      remove_avatar: false,
    });
    form.clearErrors();
    avatarSelection.clearSelection();
    resetLastEnhanced();
  };

  const cancel = () => {
    resetForm();
    setEditing(false);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    form.transform((data) => ({ ...data, _method: 'put' }));
    form.post(app.profile.update.url(), {
      forceFormData: true,
      onSuccess: () => {
        form.setData((data) => ({
          ...data,
          avatar: null,
          remove_avatar: false,
        }));
        avatarSelection.clearSelection();
        resetLastEnhanced();
        setEditing(false);
      },
    });
  };

  const removeAvatar = () => {
    if (form.data.avatar !== null) {
      form.setData('avatar', null);
      avatarSelection.clearSelection();

      return;
    }

    if (has_custom_avatar) {
      form.setData('remove_avatar', true);
    }
  };

  return (
    <TooltipProvider>
      <AppPage>
        <form onSubmit={submit} className="flex w-full flex-col gap-6">
          <AppPageCard className="flex flex-col gap-5">
            <ProfileHeader
              profile={profile}
              avatarUrl={avatarSelection.displayedUrl}
              isOwner={is_owner}
              editing={editing}
              onEdit={() => setEditing(true)}
            />

            {is_owner && editing && (
              <AvatarActions
                fileInputRef={avatarSelection.inputRef}
                processing={form.processing}
                hasAvatar={Boolean(avatarSelection.displayedUrl)}
                canRemove={
                  form.data.avatar !== null ||
                  (has_custom_avatar && !form.data.remove_avatar)
                }
                onSelect={avatarSelection.handleFileChange}
                onRemove={removeAvatar}
              />
            )}

            {!editing ? (
              <ProfileDetails profile={profile} isOwner={is_owner} />
            ) : (
              <BasicFields
                name={form.data.name}
                dateOfBirth={form.data.date_of_birth}
                provinceId={form.data.province_id}
                regencyId={form.data.regency_id}
                errors={{
                  name: form.errors.name,
                  date_of_birth: form.errors.date_of_birth,
                  province_id: form.errors.province_id,
                  regency_id: form.errors.regency_id,
                }}
                processing={form.processing}
                calendarOpen={calendarOpen}
                onCalendarOpenChange={setCalendarOpen}
                maxDateOfBirth={max_date_of_birth}
                provinces={provinces}
                regencies={regencies}
                loadingProvinces={loadingProvinces}
                loadingRegencies={loadingRegencies}
                detecting={detecting}
                onNameChange={(value) => form.setData('name', value)}
                onDateOfBirthChange={(value) =>
                  form.setData('date_of_birth', value)
                }
                onProvinceChange={(province_id) => {
                  form.setData((data) => ({
                    ...data,
                    province_id,
                    regency_id: '',
                  }));
                }}
                onRegencyChange={(regency_id) =>
                  form.setData('regency_id', regency_id)
                }
                onDetectLocation={() =>
                  detectLocation((location) => {
                    form.setData((data) => ({
                      ...data,
                      province_id: location.province_id,
                      regency_id: location.regency_id,
                    }));
                  })
                }
              />
            )}
          </AppPageCard>

          {editing && isFreelancer && (
            <AppPageCard>
              <FieldGroup>
                <FreelancerFields
                  title={form.data.title}
                  bio={form.data.bio}
                  skills={form.data.skills}
                  errors={{
                    title: form.errors.title,
                    bio: form.errors.bio,
                    skills: form.errors.skills,
                  }}
                  processing={form.processing}
                  onSkillsChange={(skills) => form.setData('skills', skills)}
                  onTitleChange={(value) => form.setData('title', value)}
                  onBioChange={(value) => form.setData('bio', value)}
                  availability={availability}
                  enhancingTitle={enhancingTitle}
                  enhancingBio={enhancingBio}
                  enhancingSkills={enhancingSkills}
                  onEnhanceTitle={() => enhance('title')}
                  onEnhanceBio={() => enhance('bio')}
                  onEnhanceSkills={enhanceSkills}
                />
              </FieldGroup>
            </AppPageCard>
          )}

          {editing && (
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                mobileLarge
                className="w-full sm:w-auto"
                onClick={cancel}
                disabled={form.processing}
              >
                Batal
              </Button>
              <Button
                type="submit"
                mobileLarge
                className="w-full sm:w-auto"
                disabled={form.processing}
              >
                {form.processing ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          )}
        </form>
      </AppPage>
    </TooltipProvider>
  );
}
