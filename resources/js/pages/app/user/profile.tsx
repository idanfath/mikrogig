import { Head, useForm, useHttp } from '@inertiajs/react';
import { format, subYears } from 'date-fns';
import {
  CalendarIcon,
  Camera,
  Info,
  Loader2,
  MapPin,
  Pencil,
  Sparkles,
  Trash,
  X,
} from 'lucide-react';
import type { ChangeEvent, FormEvent, KeyboardEvent, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { UserAvatar } from '@/components/ui/user-avatar';
import AppLayout from '@/layout/AppLayout';
import { compressImage } from '@/lib/image_utility';
import { getProfileEnhancementAvailability } from '@/lib/profile-enhancement';
import { capitalize, cn, sentenceCase } from '@/lib/utils';
import app from '@/routes/app';
import freelancer from '@/routes/freelancer';
import { resolve } from '@/routes/locations';
import {
  provinces as provincesRoute,
  regencies as regenciesRoute,
} from '@/routes/regions';
import { UserRoleFrontendLabel, type UserRole } from '@/types/enum';
import type { Region, Regency } from '@/types/region';
import { id } from 'date-fns/locale';

type FreelancerProfile = {
  title: string | null;
  bio: string | null;
  skills: string[];
};
type Profile = {
  id: number;
  name: string;
  avatar_url: string;
  role: UserRole;
  location: string | null;
  freelancer_profile?: FreelancerProfile;
  email?: string;
  date_of_birth?: string | null;
  province_id?: string | null;
  regency_id?: string | null;
};
type ProfileForm = {
  name: string;
  date_of_birth: string;
  province_id: string;
  regency_id: string;
  title: string;
  bio: string;
  skills: string[];
  avatar: File | null;
  remove_avatar: boolean;
};
type Props = {
  profile: Profile;
  is_owner: boolean;
  has_custom_avatar: boolean;
  max_date_of_birth: string | null;
};

const ProfilePage: InertiaPageWithLayout<Props> = ({
  profile,
  is_owner,
  has_custom_avatar,
  max_date_of_birth,
}) => {
  const isFreelancer = profile.role === 'freelancer';
  const [editing, setEditing] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [regencies, setRegencies] = useState<Regency[]>([]);
  const [loadingRegencies, setLoadingRegencies] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [enhancingTitle, setEnhancingTitle] = useState(false);
  const [enhancingBio, setEnhancingBio] = useState(false);
  const [enhancingSkills, setEnhancingSkills] = useState(false);
  const [lastEnhancedTitle, setLastEnhancedTitle] = useState<string | null>(
    null,
  );
  const [lastEnhancedBio, setLastEnhancedBio] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const latestProvinceRef = useRef('');
  const enhanceHttp = useHttp({
    field: '',
    value: '',
    context: { title: '', bio: '', skills: [] as string[], location: '' },
  });
  const locationHttp = useHttp({ latitude: 0, longitude: 0 });
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

  useEffect(() => {
    if (!editing || provinces.length > 0) {
      return;
    }

    void fetch(provincesRoute.url())
      .then((response) =>
        response.ok ? (response.json() as Promise<Region[]>) : Promise.reject(),
      )
      .then(setProvinces)
      .catch(() => toast.error('Gagal memuat data provinsi.'));
  }, [editing, provinces.length]);

  useEffect(() => {
    if (!editing) {
      return;
    }

    const provinceId = form.data.province_id;
    latestProvinceRef.current = provinceId;

    if (!provinceId) {
      return;
    }

    const loadRegencies = async () => {
      setLoadingRegencies(true);

      try {
        const response = await fetch(regenciesRoute.url(provinceId));

        if (!response.ok) {
          throw new Error('Gagal memuat data kabupaten/kota.');
        }

        if (latestProvinceRef.current !== provinceId) {
          return;
        }

        setRegencies((await response.json()) as Regency[]);
      } catch {
        toast.error('Gagal memuat data kabupaten/kota.');
      } finally {
        if (latestProvinceRef.current === provinceId) {
          setLoadingRegencies(false);
        }
      }
    };

    void loadRegencies();
  }, [editing, form.data.province_id]);

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const selectedProvinceName = provinces.find(
    (province) => province.id === form.data.province_id,
  )?.name;
  const selectedRegencyName = regencies.find(
    (regency) => regency.id === form.data.regency_id,
  )?.name;
  const enhancementAvailability = getProfileEnhancementAvailability({
    title: form.data.title,
    bio: form.data.bio,
    skills: form.data.skills,
    lastEnhancedTitle,
    lastEnhancedBio,
    processing:
      form.processing ||
      enhancingTitle ||
      enhancingBio ||
      enhancingSkills ||
      enhanceHttp.processing,
  });
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
    setLastEnhancedTitle(null);
    setLastEnhancedBio(null);

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
        setLastEnhancedTitle(null);
        setLastEnhancedBio(null);
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

  const toastEnhanceError = (error: any, fallback: string) => {
    if (error?.response?.status === 429) {
      toast.error('Coba Lagi Nanti.');

      return;
    }

    toast.error(error.message || fallback);
  };

  const enhance = async (field: 'title' | 'bio') => {
    const value = form.data[field];

    if (!value.trim()) {
      return;
    }

    if (field === 'title') {
      setEnhancingTitle(true);
    } else {
      setEnhancingBio(true);
    }

    enhanceHttp.transform(() => ({
      field,
      value,
      context: {
        title: form.data.title,
        bio: form.data.bio,
        skills: form.data.skills,
        location:
          selectedRegencyName && selectedProvinceName
            ? `${selectedRegencyName}, ${selectedProvinceName}`
            : profile.location ?? '',
      },
    }));

    try {
      const response = await enhanceHttp.post(freelancer.enhance.url());
      const result = response as { value?: string };

      if (result.value) {
        form.setData(field, result.value);

        if (result.value !== value) {
          toast.success('Profil berhasil ditingkatkan.');
        }

        if (field === 'title') {
          setLastEnhancedTitle(result.value);
        } else {
          setLastEnhancedBio(result.value);
        }
      }
    } catch (error: any) {
      toastEnhanceError(error, 'Gagal meningkatkan dengan AI');
    } finally {
      if (field === 'title') {
        setEnhancingTitle(false);
      } else {
        setEnhancingBio(false);
      }
    }
  };

  const enhanceSkills = async () => {
    if (!form.data.title.trim() || !form.data.bio.trim()) {
      return;
    }

    setEnhancingSkills(true);
    enhanceHttp.transform(() => ({
      field: 'skills',
      value: '',
      context: {
        title: form.data.title,
        bio: form.data.bio,
        skills: form.data.skills,
        location:
          selectedRegencyName && selectedProvinceName
            ? `${selectedRegencyName}, ${selectedProvinceName}`
            : profile.location ?? '',
      },
    }));

    try {
      const response = await enhanceHttp.post(freelancer.enhance.url());
      const result = response as { value?: string[] };

      if (Array.isArray(result.value)) {
        const skills = [...form.data.skills];

        result.value.forEach((skill) => {
          const normalizedSkill = skill.trim().toLowerCase();

          if (normalizedSkill && !skills.includes(normalizedSkill)) {
            skills.push(normalizedSkill);
          }
        });

        form.setData('skills', skills);
        toast.success('Rekomendasi keahlian berhasil ditambahkan.');
      }
    } catch (error: any) {
      toastEnhanceError(error, 'Gagal merekomendasikan keahlian');
    } finally {
      setEnhancingSkills(false);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation tidak didukung oleh browser Anda.');

      return;
    }

    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          locationHttp.transform(() => ({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
          const result = (await locationHttp.post(resolve.url())) as {
            province_id: string;
            regency_id: string;
          };

          form.setData((data) => ({
            ...data,
            province_id: result.province_id,
            regency_id: result.regency_id,
          }));
          toast.success('Lokasi berhasil dideteksi.');
        } catch (error: any) {
          toast.error(error.message || 'Gagal mendeteksi lokasi.');
        } finally {
          setDetecting(false);
        }
      },
      (error) => {
        toast.error(
          error.code === error.PERMISSION_DENIED
            ? 'Izin lokasi ditolak oleh browser. Silakan aktifkan izin lokasi.'
            : 'Gagal mengakses GPS.',
        );
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const selectedBirthDate = form.data.date_of_birth
    ? new Date(form.data.date_of_birth)
    : undefined;
  const defaultBirthMonth =
    selectedBirthDate ??
    (max_date_of_birth
      ? new Date(max_date_of_birth)
      : subYears(new Date(), 18));

  return (
    <>
      <Head title="Profil" />
      <TooltipProvider>
        <form
          onSubmit={submit}
          className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pb-6"
        >
          <section className="flex flex-col gap-5 rounded-2xl border bg-card p-6 shadow-xs">
            <ProfileHeader
              profile={profile}
              avatarUrl={displayAvatarUrl}
              isOwner={is_owner}
              editing={editing}
              onEdit={() => setEditing(true)}
            />

            {is_owner && editing && (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInput.current?.click()}
                  disabled={form.processing}
                >
                  <Camera data-icon="inline-start" />
                  Ganti foto
                </Button>
                {(form.data.avatar !== null ||
                  (has_custom_avatar && !form.data.remove_avatar)) && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={removeAvatar}
                      disabled={form.processing}
                    >
                      <Trash data-icon="inline-start" />
                      Hapus foto
                    </Button>
                  )}
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={selectAvatar}
                />
              </div>
            )}

            {!editing ? (
              <ProfileDetails profile={profile} isOwner={is_owner} />
            ) : (
              <FieldGroup>
                <Field data-invalid={Boolean(form.errors.name)}>
                  <FieldLabel htmlFor="name">Nama</FieldLabel>
                  <Input
                    id="name"
                    value={form.data.name}
                    onChange={(event) => form.setData('name', event.target.value)}
                    aria-invalid={Boolean(form.errors.name)}
                    disabled={form.processing}
                  />
                  {form.errors.name && (
                    <FieldDescription>{form.errors.name}</FieldDescription>
                  )}
                </Field>
                <Field data-invalid={Boolean(form.errors.date_of_birth)}>
                  <div className="flex items-center gap-1">
                    <FieldLabel htmlFor="date_of_birth">Tanggal lahir</FieldLabel>
                    <PrivacyTooltip />
                  </div>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        id="date_of_birth"
                        className="w-full justify-start font-normal"
                        disabled={form.processing}
                      >
                        <CalendarIcon data-icon="inline-start" />
                        {selectedBirthDate
                          ? format(selectedBirthDate, 'dd MMMM yyyy', { locale: id })
                          : 'Pilih tanggal lahir'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto overflow-hidden p-0"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={selectedBirthDate}
                        captionLayout="dropdown"
                        defaultMonth={defaultBirthMonth}
                        disabled={{ after: defaultBirthMonth }}
                        onSelect={(date) => {
                          if (date) {
                            form.setData(
                              'date_of_birth',
                              format(date, 'yyyy-MM-dd', { locale: id }),
                            );
                          }

                          setCalendarOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  {form.errors.date_of_birth && (
                    <FieldDescription>
                      {form.errors.date_of_birth}
                    </FieldDescription>
                  )}
                </Field>
                <Field>
                  <FieldLabel htmlFor="province_id">Provinsi</FieldLabel>
                  <Select
                    value={form.data.province_id}
                    onValueChange={(province_id) => {
                      setRegencies([]);
                      form.setData((data) => ({
                        ...data,
                        province_id,
                        regency_id: '',
                      }));
                    }}
                    disabled={form.processing}
                  >
                    <SelectTrigger id="province_id" className="h-11 w-full">
                      <SelectValue placeholder="Pilih provinsi" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {provinces.map((province) => (
                        <SelectItem key={province.id} value={province.id}>
                          {province.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="regency_id">Kabupaten / Kota</FieldLabel>
                  <Select
                    value={form.data.regency_id}
                    onValueChange={(regency_id) =>
                      form.setData('regency_id', regency_id)
                    }
                    disabled={
                      form.processing ||
                      loadingRegencies ||
                      !form.data.province_id
                    }
                  >
                    <SelectTrigger id="regency_id" className="h-11 w-full">
                      <SelectValue placeholder="Pilih kabupaten / kota" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {regencies.map((regency) => (
                        <SelectItem key={regency.id} value={regency.id}>
                          {regency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={detectLocation}
                    disabled={form.processing || detecting}
                    className="h-11 w-full"
                  >
                    {detecting ? (
                      <Loader2
                        className="animate-spin text-primary"
                        data-icon="inline-start"
                      />
                    ) : (
                      <MapPin className="text-primary" data-icon="inline-start" />
                    )}
                    {detecting
                      ? 'Mendeteksi Lokasi...'
                      : 'Deteksi Lokasi Otomatis (GPS)'}
                  </Button>
                </Field>
              </FieldGroup>
            )}
          </section>

          {editing && isFreelancer && (
            <section className="rounded-2xl border bg-card p-6 shadow-xs">
              <FieldGroup>
                <FreelancerFields
                  form={form}
                  skillInput={skillInput}
                  setSkillInput={setSkillInput}
                  addSkill={addSkill}
                  enhance={enhance}
                  enhanceSkills={enhanceSkills}
                  availability={enhancementAvailability}
                  enhancingTitle={enhancingTitle}
                  enhancingBio={enhancingBio}
                  enhancingSkills={enhancingSkills}
                />
              </FieldGroup>
            </section>
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
      </TooltipProvider>
    </>
  );
};

function ProfileHeader({
  profile,
  avatarUrl,
  isOwner,
  editing,
  onEdit,
}: {
  profile: Profile;
  avatarUrl?: string;
  isOwner: boolean;
  editing: boolean;
  onEdit: () => void;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-center gap-4">
        <UserAvatar user={{ name: profile.name, avatar_url: avatarUrl }} size="lg" />
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold">{profile.name}</h1>
            <Badge>{UserRoleFrontendLabel[profile.role]}</Badge>
          </div>
          {profile.location && (
            <p className="text-sm text-muted-foreground">{capitalize(profile.location, true)}</p>
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

function PrivacyTooltip() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="text-muted-foreground hover:text-muted-foreground "
          aria-label="Informasi privasi"
        >
          <Info size={12} />
        </button>
      </TooltipTrigger>
      <TooltipContent>Hanya terlihat oleh Anda.</TooltipContent>
    </Tooltip>
  );
}

function ProfileDetails({
  profile,
  isOwner,
}: {
  profile: Profile;
  isOwner: boolean;
}) {
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
              ? format(new Date(profile.date_of_birth), 'dd MMMM yyyy', { locale: id })
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
    </div>
  );
}

function FreelancerFields({
  form,
  skillInput,
  setSkillInput,
  addSkill,
  enhance,
  enhanceSkills,
  availability,
  enhancingTitle,
  enhancingBio,
  enhancingSkills,
}: {
  form: ReturnType<typeof useForm<ProfileForm>>;
  skillInput: string;
  setSkillInput: (value: string) => void;
  addSkill: () => void;
  enhance: (field: 'title' | 'bio') => void;
  enhanceSkills: () => void;
  availability: ReturnType<typeof getProfileEnhancementAvailability>;
  enhancingTitle: boolean;
  enhancingBio: boolean;
  enhancingSkills: boolean;
}) {
  return (
    <>
      <Field data-invalid={Boolean(form.errors.title)}>
        <div className="flex items-center justify-between gap-2">
          <FieldLabel htmlFor="title">Judul profil</FieldLabel>
          {(availability.title || enhancingTitle) && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
              onClick={() => enhance('title')}
              disabled={!availability.title}
            >
              <Sparkles
                data-icon="inline-start"
                className={cn('text-primary', enhancingTitle && 'animate-pulse')}
              />
              {enhancingTitle ? 'Memproses...' : 'Tingkatkan dengan AI'}
            </Button>
          )}
        </div>
        <FieldDescription>
          Contoh: Tukang Las, Cleaning Service, Supir Pribadi, Buruh Bangunan, dll.
        </FieldDescription>
        <Input
          id="title"
          placeholder="Masukkan judul profilmu"
          value={form.data.title}
          onChange={(event) => form.setData('title', event.target.value)}
          aria-invalid={Boolean(form.errors.title)}
          disabled={form.processing || enhancingTitle}
        />
        {form.errors.title && (
          <FieldDescription>{form.errors.title}</FieldDescription>
        )}
      </Field>
      <Field data-invalid={Boolean(form.errors.bio)}>
        <div className="flex items-center justify-between gap-2">
          <FieldLabel htmlFor="bio">Bio</FieldLabel>
          {(availability.bio || enhancingBio) && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
              onClick={() => enhance('bio')}
              disabled={!availability.bio}
            >
              <Sparkles
                data-icon="inline-start"
                className={cn('text-primary', enhancingBio && 'animate-pulse')}
              />
              {enhancingBio ? 'Memproses...' : 'Tingkatkan dengan AI'}
            </Button>
          )}
        </div>
        <FieldDescription>Ceritakan tentang dirimu dan pengalamanmu</FieldDescription>
        <Textarea
          id="bio"
          rows={3}
          placeholder="Saya seorang tukang las dengan pengalaman 5 tahun..."
          value={form.data.bio}
          onChange={(event) => form.setData('bio', event.target.value)}
          aria-invalid={Boolean(form.errors.bio)}
          disabled={form.processing || enhancingBio}
        />
        {form.errors.bio && (
          <FieldDescription>{form.errors.bio}</FieldDescription>
        )}
      </Field>
      <Field data-invalid={Boolean(form.errors.skills)}>
        <div className="flex items-center justify-between gap-2">
          <FieldLabel>Keahlian</FieldLabel>
          {(availability.skills || enhancingSkills) && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
              onClick={enhanceSkills}
              disabled={!availability.skills}
            >
              <Sparkles
                data-icon="inline-start"
                className={cn('text-primary', enhancingSkills && 'animate-pulse')}
              />
              {enhancingSkills ? 'Memproses...' : 'Rekomendasikan Keahlian'}
            </Button>
          )}
        </div>
        <FieldDescription>Tambahkan keahlian yang kamu miliki</FieldDescription>
        <Input
          placeholder="Contoh: Las, Cat, Listrik"
          value={skillInput}
          onChange={(event) => setSkillInput(event.target.value)}
          onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addSkill();
            }
          }}
          disabled={form.processing || enhancingSkills}
        />
        <Button
          type="button"
          variant="outline"
          onClick={addSkill}
          disabled={form.processing || enhancingSkills}
        >
          Tambah
        </Button>
        {form.errors.skills && (
          <FieldDescription>{form.errors.skills}</FieldDescription>
        )}
        {form.data.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {form.data.skills.map((skill) => (
              <Badge key={skill} variant="accent" className="gap-1">
                {skill}
                <button
                  type="button"
                  onClick={() =>
                    form.setData(
                      'skills',
                      form.data.skills.filter((item) => item !== skill),
                    )
                  }
                  className="ml-1 hover:text-destructive"
                  aria-label={`Hapus ${skill}`}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </Field>
    </>
  );
}

ProfilePage.layout = (page: ReactNode) => (
  <AppLayout title="Profil">{page}</AppLayout>
);

export default ProfilePage;
