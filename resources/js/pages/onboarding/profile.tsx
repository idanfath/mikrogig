import { useForm, usePage } from '@inertiajs/react';
import { format, subYears } from 'date-fns';
import { CalendarIcon, Loader2, MapPin, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { ProfileEnhanceButton } from '@/components/profile/profile-enhance-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDetectLocation } from '@/hooks/use-detect-location';
import { useProfileEnhance } from '@/hooks/use-profile-enhance';
import { useRegionSelect } from '@/hooks/use-region-select';
import OnboardingLayout from '@/layout/OnboardingLayout';
import onboarding from '@/routes/onboarding';
import type { Auth } from '@/types/auth';
import { id } from 'date-fns/locale';

const OnboardingProfile: InertiaPageWithLayout = () => {
  const { auth, max_date_of_birth } = usePage<{
    auth: Auth;
    max_date_of_birth?: string;
  }>().props;
  const { detecting, detectLocation } = useDetectLocation();
  const isFreelancer = auth.user.role === 'freelancer';

  const { data, setData, post, processing } = useForm({
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
    provinceId: data.province_id,
    regencyId: data.regency_id,
    enabled: true,
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
    title: data.title,
    bio: data.bio,
    skills: data.skills,
    location: enhanceLocation,
    formProcessing: processing,
    onTitleChange: (value) => setData('title', value),
    onBioChange: (value) => setData('bio', value),
    onSkillsChange: (skills) => setData('skills', skills),
  });

  const handleProvinceChange = (id: string) => {
    setData((prev) => ({
      ...prev,
      province_id: id,
      regency_id: '',
    }));
  };

  const handleRegencyChange = (id: string) => {
    if (!id) {
      return;
    }

    setData((prev) => ({
      ...prev,
      regency_id: id,
    }));
  };

  const [skillInput, setSkillInput] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);

  const isProfileComplete = isFreelancer
    ? data.title.trim() !== '' &&
    data.bio.trim() !== '' &&
    data.skills.length > 0 &&
    data.date_of_birth !== '' &&
    data.province_id !== '' &&
    data.regency_id !== ''
    : data.date_of_birth !== '' &&
    data.province_id !== '' &&
    data.regency_id !== '';

  const addSkill = () => {
    const items = skillInput
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s && !data.skills.includes(s));

    if (items.length > 0) {
      setData('skills', [...data.skills, ...items]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setData(
      'skills',
      data.skills.filter((s) => s !== skill),
    );
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(onboarding.profile.url());
  };

  return (
    <form onSubmit={submit} className="flex flex-1 flex-col items-center gap-4">
      <div className="w-full max-w-xl rounded-2xl border border-neutral-100 bg-white p-8 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
        <FieldGroup>
          {isFreelancer && (
            <>
              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="title">Judul Profil</FieldLabel>
                  <ProfileEnhanceButton
                    available={availability.title}
                    loading={enhancingTitle}
                    idleLabel="Tingkatkan dengan AI"
                    onClick={() => enhance('title')}
                  />
                </div>
                <FieldDescription>
                  Contoh: Tukang Las, Cleaning Service, Supir Pribadi, Buruh
                  Bangunan, dll.
                </FieldDescription>
                <Input
                  id="title"
                  placeholder="Masukkan judul profilmu"
                  value={data.title}
                  onChange={(e) => setData('title', e.target.value)}
                  disabled={processing || enhancingTitle}
                />
              </Field>

              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="bio">Bio</FieldLabel>
                  <ProfileEnhanceButton
                    available={availability.bio}
                    loading={enhancingBio}
                    idleLabel="Tingkatkan dengan AI"
                    onClick={() => enhance('bio')}
                  />
                </div>
                <FieldDescription>
                  Ceritakan tentang dirimu dan pengalamanmu
                </FieldDescription>
                <textarea
                  id="bio"
                  rows={3}
                  placeholder="Saya seorang tukang las dengan pengalaman 5 tahun..."
                  value={data.bio}
                  onChange={(e) => setData('bio', e.target.value)}
                  className="w-full min-w-0 rounded-md border border-input bg-card px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 dark:bg-input/30"
                  disabled={processing || enhancingBio}
                />
              </Field>

              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel>Keahlian</FieldLabel>
                  <ProfileEnhanceButton
                    available={availability.skills}
                    loading={enhancingSkills}
                    idleLabel="Rekomendasikan Keahlian"
                    onClick={enhanceSkills}
                  />
                </div>
                <FieldDescription>
                  Tambahkan keahlian yang kamu miliki
                </FieldDescription>
                <Input
                  placeholder="Contoh: Las, Cat, Listrik"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  disabled={processing || enhancingSkills}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addSkill}
                  disabled={processing || enhancingSkills}
                >
                  Tambah
                </Button>
                {data.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {data.skills.map((skill) => (
                      <Badge key={skill} variant="accent" className="gap-1">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </Field>
            </>
          )}

          <Field>
            <FieldLabel htmlFor="date_of_birth">Tanggal Lahir</FieldLabel>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  id="date_of_birth"
                  className="w-full justify-start font-normal"
                >
                  <CalendarIcon className="size-4" />
                  {data.date_of_birth
                    ? format(new Date(data.date_of_birth), 'dd MMMM yyyy', {
                      locale: id,
                    })
                    : 'Pilih tanggal lahir'}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto overflow-hidden p-0"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={
                    data.date_of_birth
                      ? new Date(data.date_of_birth)
                      : undefined
                  }
                  captionLayout="dropdown"
                  defaultMonth={
                    max_date_of_birth
                      ? new Date(max_date_of_birth)
                      : subYears(new Date(), 18)
                  }
                  disabled={{
                    after: max_date_of_birth
                      ? new Date(max_date_of_birth)
                      : subYears(new Date(), 18),
                  }}
                  onSelect={(date) => {
                    if (date) {
                      setData('date_of_birth', format(date, 'yyyy-MM-dd'));
                    }

                    setCalendarOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </Field>

          <Field>
            <Field>
              <FieldLabel htmlFor="province_id">Provinsi</FieldLabel>
              <Select
                value={data.province_id}
                onValueChange={handleProvinceChange}
                disabled={processing || loadingProvinces}
              >
                <SelectTrigger id="province_id" className="h-11 w-full">
                  <SelectValue
                    placeholder={
                      loadingProvinces ? 'Memuat...' : 'Pilih Provinsi'
                    }
                  />
                </SelectTrigger>
                <SelectContent position="popper">
                  {provinces.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="regency_id">Kabupaten / Kota</FieldLabel>
              <Select
                value={data.regency_id}
                onValueChange={handleRegencyChange}
                disabled={processing || loadingRegencies || !data.province_id}
              >
                <SelectTrigger id="regency_id" className="h-11 w-full">
                  <SelectValue
                    placeholder={
                      loadingRegencies ? 'Memuat...' : 'Pilih Kabupaten / Kota'
                    }
                  />
                </SelectTrigger>
                <SelectContent position="popper">
                  {regencies.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </Field>

          <Field>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                detectLocation((location) => {
                  setData((prev) => ({
                    ...prev,
                    province_id: location.province_id,
                    regency_id: location.regency_id,
                  }));
                })
              }
              disabled={processing || loadingProvinces || detecting}
              className="h-11 w-full gap-2"
            >
              {detecting ? (
                <Loader2 className="size-4 animate-spin text-primary" />
              ) : (
                <MapPin className="size-4 text-primary" />
              )}
              {detecting
                ? 'Mendeteksi Lokasi...'
                : 'Deteksi Lokasi Otomatis (GPS)'}
            </Button>
          </Field>
        </FieldGroup>
      </div>

      <div className="flex w-full flex-col items-center gap-4 sm:items-end">
        <Button
          type="submit"
          mobileLarge
          className="w-full sm:w-auto"
          disabled={processing || !isProfileComplete}
        >
          {processing ? 'Menyimpan...' : 'Simpan Profil'}
        </Button>
        <p className="max-w-sm text-center text-xs text-muted-foreground sm:text-right">
          Dengan mengklik "Simpan Profil", Anda menyatakan bahwa seluruh
          informasi yang Anda berikan telah dibaca dan dikonfirmasi
          kebenarannya.
        </p>
      </div>
    </form>
  );
};

OnboardingProfile.layout = (page: ReactNode) => (
  <OnboardingLayout
    title="Lengkapi profil Anda"
    description="Isi profil Anda agar orang lain dapat mengenal Anda lebih baik."
  >
    {page}
  </OnboardingLayout>
);

export default OnboardingProfile;
