import { useForm } from '@inertiajs/react';
import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { AppPage, AppPageCard } from '@/components/layout/app-page';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useProfileEnhance } from '@/features/profile/hooks/use-profile-enhance';
import type { ProfileForm, ProfilePageProps } from '@/features/profile/types';
import { useRegionSelect } from '@/features/regions/hooks/use-region-select';
import { useDetectLocation } from '@/hooks/use-detect-location';
import { compressImage } from '@/lib/image_utility';
import app from '@/routes/app';
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
  const [skillInput, setSkillInput] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const existingAvatarUrl =
    has_custom_avatar && !form.data.remove_avatar
      ? profile.avatar_url
      : undefined;
  const displayAvatarUrl = avatarPreview ?? existingAvatarUrl;

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
    setAvatarPreview(null);
    setSkillInput('');
    resetLastEnhanced();

    if (fileInput.current) {
      fileInput.current.value = '';
    }
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
        setAvatarPreview(null);
        resetLastEnhanced();
        setEditing(false);
      },
    });
  };

  const selectAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const avatar = await compressImage(
        file,
        'profile_picture',
        undefined,
        false,
        512 * 1024,
      );

      setAvatarPreview(URL.createObjectURL(avatar));
      form.setData((data) => ({ ...data, avatar, remove_avatar: false }));
    } catch {
      toast.error('Gagal mengompres gambar.');
    } finally {
      if (fileInput.current) {
        fileInput.current.value = '';
      }
    }
  };

  const removeAvatar = () => {
    if (form.data.avatar !== null) {
      form.setData('avatar', null);
      setAvatarPreview(null);

      return;
    }

    if (has_custom_avatar) {
      form.setData('remove_avatar', true);
    }
  };

  const addSkill = () => {
    const skills = skillInput
      .split(',')
      .map((skill) => skill.trim().toLowerCase())
      .filter((skill) => skill && !form.data.skills.includes(skill));

    if (skills.length > 0) {
      form.setData('skills', [...form.data.skills, ...skills]);
      setSkillInput('');
    }
  };

  return (
    <TooltipProvider>
      <AppPage>
        <form onSubmit={submit} className="flex w-full flex-col gap-6">
          <AppPageCard className="flex flex-col gap-5">
            <ProfileHeader
              profile={profile}
              avatarUrl={displayAvatarUrl}
              isOwner={is_owner}
              editing={editing}
              onEdit={() => setEditing(true)}
            />

            {is_owner && editing && (
              <AvatarActions
                fileInputRef={fileInput}
                processing={form.processing}
                canRemove={
                  form.data.avatar !== null ||
                  (has_custom_avatar && !form.data.remove_avatar)
                }
                onSelect={selectAvatar}
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
                }}
                processing={form.processing}
                calendarOpen={calendarOpen}
                onCalendarOpenChange={setCalendarOpen}
                maxDateOfBirth={max_date_of_birth}
                provinces={provinces}
                regencies={regencies}
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
                  skillInput={skillInput}
                  onSkillInputChange={setSkillInput}
                  onAddSkill={addSkill}
                  onRemoveSkill={(skill) =>
                    form.setData(
                      'skills',
                      form.data.skills.filter((item) => item !== skill),
                    )
                  }
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
