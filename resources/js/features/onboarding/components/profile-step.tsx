import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { FreelancerFields } from '@/features/profile/components/freelancer-fields';
import { ProfileLocationFields } from '@/features/profile/components/profile-location-fields';
import { useProfileEnhance } from '@/features/profile/hooks/use-profile-enhance';
import { useRegionSelect } from '@/features/regions/hooks/use-region-select';
import { useDetectLocation } from '@/features/regions/hooks/use-detect-location';
import onboarding from '@/routes/onboarding';
import type { OnboardingProfilePageProps } from '../types';

export function ProfileStep({
  auth,
  max_date_of_birth,
}: OnboardingProfilePageProps) {
  const { detecting, detectLocation } = useDetectLocation();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const isFreelancer = auth.user.role === 'freelancer';
  const form = useForm({
    title: '',
    bio: '',
    skills: [] as string[],
    date_of_birth: '',
    province_id: '',
    regency_id: '',
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
  });
  const enhanceLocation =
    selectedRegencyName && selectedProvinceName
      ? `${selectedRegencyName}, ${selectedProvinceName}`
      : '';
  const {
    availability,
    enhancingTitle,
    enhancingBio,
    enhancingSkills,
    enhance,
    enhanceSkills,
  } = useProfileEnhance({
    title: form.data.title,
    bio: form.data.bio,
    skills: form.data.skills,
    location: enhanceLocation,
    formProcessing: form.processing,
    onTitleChange: (title) => form.setData('title', title),
    onBioChange: (bio) => form.setData('bio', bio),
    onSkillsChange: (skills) => form.setData('skills', skills),
  });
  const isProfileComplete = isFreelancer
    ? form.data.title.trim() !== '' &&
      form.data.bio.trim() !== '' &&
      form.data.skills.length > 0 &&
      form.data.date_of_birth !== '' &&
      form.data.province_id !== '' &&
      form.data.regency_id !== ''
    : form.data.date_of_birth !== '' &&
      form.data.province_id !== '' &&
      form.data.regency_id !== '';

  const submit = (event: FormEvent) => {
    event.preventDefault();
    form.post(onboarding.profile.url());
  };

  return (
    <form onSubmit={submit} className="flex flex-1 flex-col items-center gap-4">
      <div className="w-full max-w-xl rounded-2xl border border-neutral-100 bg-white p-8 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
        <FieldGroup>
          {isFreelancer && (
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
              onTitleChange={(title) => form.setData('title', title)}
              onBioChange={(bio) => form.setData('bio', bio)}
              availability={availability}
              enhancingTitle={enhancingTitle}
              enhancingBio={enhancingBio}
              enhancingSkills={enhancingSkills}
              onEnhanceTitle={() => enhance('title')}
              onEnhanceBio={() => enhance('bio')}
              onEnhanceSkills={enhanceSkills}
            />
          )}
          <ProfileLocationFields
            dateOfBirth={form.data.date_of_birth}
            provinceId={form.data.province_id}
            regencyId={form.data.regency_id}
            errors={{
              date_of_birth: form.errors.date_of_birth,
              province_id: form.errors.province_id,
              regency_id: form.errors.regency_id,
            }}
            processing={form.processing}
            calendarOpen={calendarOpen}
            onCalendarOpenChange={setCalendarOpen}
            maxDateOfBirth={max_date_of_birth ?? null}
            provinces={provinces}
            regencies={regencies}
            loadingProvinces={loadingProvinces}
            loadingRegencies={loadingRegencies}
            detecting={detecting}
            onDateOfBirthChange={(date_of_birth) =>
              form.setData('date_of_birth', date_of_birth)
            }
            onProvinceChange={(province_id) =>
              form.setData((data) => ({ ...data, province_id, regency_id: '' }))
            }
            onRegencyChange={(regency_id) =>
              form.setData('regency_id', regency_id)
            }
            onDetectLocation={() =>
              detectLocation((location) => {
                form.setData((data) => ({ ...data, ...location }));
              })
            }
          />
        </FieldGroup>
      </div>

      <div className="flex w-full flex-col items-center gap-4 sm:items-end">
        <Button
          type="submit"
          mobileLarge
          className="w-full sm:w-auto"
          disabled={form.processing || !isProfileComplete}
        >
          {form.processing ? 'Menyimpan...' : 'Simpan Profil'}
        </Button>
        <p className="max-w-sm text-center text-xs text-muted-foreground sm:text-right">
          Dengan mengklik "Simpan Profil", Anda menyatakan bahwa seluruh
          informasi yang Anda berikan telah dibaca dan dikonfirmasi
          kebenarannya.
        </p>
      </div>
    </form>
  );
}
