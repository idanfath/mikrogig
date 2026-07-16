import { useForm, usePage, useHttp } from '@inertiajs/react';
import { format, subYears } from 'date-fns';
import { CalendarIcon, Loader2, MapPin, Sparkles, X } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { useEffect, useState } from 'react';
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
import OnboardingLayout from '@/layout/OnboardingLayout';
import onboarding from '@/routes/onboarding';
import type { Auth } from '@/types/auth';

type InertiaPageWithLayout = (() => ReactElement) & {
    layout?: (page: ReactNode) => ReactNode;
};

const OnboardingProfile: InertiaPageWithLayout = () => {
    const { auth } = usePage<{ auth: Auth }>().props;
    const enhanceHttp = useHttp({
        field: '',
        value: '',
        context: {},
    });
    const isFreelancer = auth.user.role === 'freelancer';

    const { data, setData, post, processing } = useForm({
        title: '',
        bio: '',
        skills: [] as string[],
        date_of_birth: '',
        province_id: '',
        regency_id: '',
        province_name: '',
        regency_name: '',
    });

    const [provinces, setProvinces] = useState<
        Array<{ id: string; name: string }>
    >([]);
    const [regencies, setRegencies] = useState<
        Array<{ id: string; name: string }>
    >([]);
    const [loadingProvinces, setLoadingProvinces] = useState(true);
    const [loadingRegencies, setLoadingRegencies] = useState(false);

    useEffect(() => {
        fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
            .then((res) => res.json())
            .then((d) => {
                setProvinces(d);
                setLoadingProvinces(false);
            })
            .catch((err) => {
                toast.error('Gagal memuat data provinsi.');
                setLoadingProvinces(false);
            });
    }, []);

    const normWilayah = (s: string) =>
        s
            .toLowerCase()
            .replace(
                /daerah khusus ibukota|provinsi|propinsi|kabupaten|kota/g,
                '',
            )
            .trim();

    const latestProvinceRef = useState<{ id: string }>({ id: '' })[0];

    useEffect(() => {
        const pid = data.province_id;
        latestProvinceRef.id = pid;

        if (!pid) {
            setRegencies([]);
            return;
        }

        // skip if regencies already belong to this province (emsifa ids prefix = province id)
        if (regencies.length > 0 && regencies[0]?.id?.startsWith(pid)) {
            setLoadingRegencies(false);
            return;
        }

        setLoadingRegencies(true);
        fetch(
            `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${pid}.json`,
        )
            .then((res) => res.json())
            .then((resData) => {
                if (latestProvinceRef.id !== pid) {
                    return;
                }
                setRegencies(resData);
            })
            .catch((err) => {
                toast.error('Gagal memuat data kabupaten/kota.');
            })
            .finally(() => {
                if (latestProvinceRef.id === pid) {
                    setLoadingRegencies(false);
                }
            });
    }, [data.province_id]);

    const handleProvinceChange = (id: string) => {
        const selectedProv = provinces.find((p) => p.id === id);

        if (id) {
            setLoadingRegencies(true);
        } else {
            setRegencies([]);
        }

        setData((prev) => ({
            ...prev,
            province_id: id,
            province_name: selectedProv ? selectedProv.name : '',
            regency_id: '',
            regency_name: '',
        }));
    };

    const handleRegencyChange = (id: string) => {
        if (!id) {
            return;
        }
        const selectedReg = regencies.find((r) => r.id === id);
        setData((prev) => ({
            ...prev,
            regency_id: id,
            regency_name: selectedReg ? selectedReg.name : '',
        }));
    };

    const [detecting, setDetecting] = useState(false);

    const detectLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation tidak didukung oleh browser Anda.');
            return;
        }

        setDetecting(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=id`,
                    );

                    if (!response.ok) {
                        throw new Error('Gagal menghubungi layanan geocoding.');
                    }

                    const resData = await response.json();
                    const address = resData.address || {};

                    const stateName = normWilayah(
                        address.state || address.province || '',
                    );
                    const cityName = normWilayah(
                        address.city ||
                            address.regency ||
                            address.municipality ||
                            address.county ||
                            address.town ||
                            '',
                    );

                    if (!stateName) {
                        throw new Error('Provinsi tidak terdeteksi.');
                    }

                    const matchedProv = provinces.find((p) => {
                        const name = normWilayah(p.name);
                        return (
                            name.includes(stateName) || stateName.includes(name)
                        );
                    });

                    if (!matchedProv) {
                        throw new Error(
                            'Provinsi Anda tidak terdaftar di database.',
                        );
                    }

                    const regResponse = await fetch(
                        `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${matchedProv.id}.json`,
                    );

                    if (!regResponse.ok) {
                        throw new Error('Gagal mengambil data kabupaten/kota.');
                    }

                    const regs = (await regResponse.json()) as Array<{
                        id: string;
                        name: string;
                    }>;
                    setRegencies(regs);

                    const matchedReg = regs.find((r) => {
                        const name = normWilayah(r.name);
                        return (
                            name.includes(cityName) || cityName.includes(name)
                        );
                    });

                    setData((prev) => ({
                        ...prev,
                        province_id: matchedProv.id,
                        province_name: matchedProv.name,
                        regency_id: matchedReg ? matchedReg.id : '',
                        regency_name: matchedReg ? matchedReg.name : '',
                    }));
                    toast.success('Lokasi berhasil dideteksi.');
                } catch (err: any) {
                    toast.error(err.message || 'Gagal mendeteksi lokasi.');
                } finally {
                    setDetecting(false);
                }
            },
            (err) => {
                let msg = 'Gagal mengakses GPS.';

                if (err.code === err.PERMISSION_DENIED) {
                    msg =
                        'Izin lokasi ditolak oleh browser. Silakan aktifkan izin lokasi.';
                }

                toast.error(msg);
                setDetecting(false);
            },
            { enableHighAccuracy: true, timeout: 10000 },
        );
    };

    const [skillInput, setSkillInput] = useState('');
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [enhancingTitle, setEnhancingTitle] = useState(false);
    const [enhancingBio, setEnhancingBio] = useState(false);
    const [enhancingSkills, setEnhancingSkills] = useState(false);
    const [lastEnhancedTitle, setLastEnhancedTitle] = useState<string | null>(
        null,
    );
    const [lastEnhancedBio, setLastEnhancedBio] = useState<string | null>(null);

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

    const handleEnhance = async (field: 'title' | 'bio', value: string) => {
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
                title: data.title,
                bio: data.bio,
                skills: data.skills,
                location:
                    data.regency_name && data.province_name
                        ? `${data.regency_name}, ${data.province_name}`
                        : '',
            },
        }));

        try {
            const response = await enhanceHttp.post(onboarding.enhance.url());
            const result = response as any;

            if (result.value) {
                setData(field, result.value);
                toast.success('Profil berhasil ditingkatkan.');

                if (field === 'title') {
                    setLastEnhancedTitle(result.value);
                } else {
                    setLastEnhancedBio(result.value);
                }
            }
        } catch (error: any) {
            toast.error(error.message || 'Gagal meningkatkan dengan AI');
        } finally {
            if (field === 'title') {
                setEnhancingTitle(false);
            } else {
                setEnhancingBio(false);
            }
        }
    };

    const handleEnhanceSkills = async () => {
        if (!data.title.trim() && !data.bio.trim()) {
            return;
        }

        setEnhancingSkills(true);

        enhanceHttp.transform(() => ({
            field: 'skills',
            value: '',
            context: {
                title: data.title,
                bio: data.bio,
                skills: data.skills,
                location:
                    data.regency_name && data.province_name
                        ? `${data.regency_name}, ${data.province_name}`
                        : '',
            },
        }));

        try {
            const response = await enhanceHttp.post(onboarding.enhance.url());
            const result = response as any;

            if (result.value && Array.isArray(result.value)) {
                const newSkills = [...data.skills];
                result.value.forEach((skill: string) => {
                    const trimmed = skill.trim().toLowerCase();

                    if (trimmed && !newSkills.includes(trimmed)) {
                        newSkills.push(trimmed);
                    }
                });
                setData('skills', newSkills);
                toast.success('Rekomendasi keahlian berhasil ditambahkan.');
            }
        } catch (error: any) {
            toast.error(error.message || 'Gagal merekomendasikan keahlian');
        } finally {
            setEnhancingSkills(false);
        }
    };

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
        <form
            onSubmit={submit}
            className="flex flex-1 flex-col items-center gap-4"
        >
            <div className="w-full max-w-xl rounded-2xl border border-neutral-100 bg-white p-8 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                <FieldGroup>
                    {isFreelancer && (
                        <>
                            <Field>
                                <div className="flex items-center justify-between">
                                    <FieldLabel htmlFor="title">
                                        Judul Profil
                                    </FieldLabel>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 gap-1.5 text-xs"
                                        disabled={
                                            !data.title.trim() ||
                                            data.title === lastEnhancedTitle ||
                                            enhancingTitle ||
                                            processing
                                        }
                                        onClick={() =>
                                            handleEnhance('title', data.title)
                                        }
                                    >
                                        <Sparkles
                                            className={`size-3.5 text-violet-500 ${enhancingTitle ? 'animate-pulse' : ''}`}
                                        />
                                        {enhancingTitle
                                            ? 'Memproses...'
                                            : 'Tingkatkan dengan AI'}
                                    </Button>
                                </div>
                                <FieldDescription>
                                    Contoh: Tukang Las, Cleaning Service, Supir
                                    Pribadi, Buruh Bangunan, dll.
                                </FieldDescription>
                                <Input
                                    id="title"
                                    placeholder="Masukkan judul profilmu"
                                    value={data.title}
                                    onChange={(e) =>
                                        setData('title', e.target.value)
                                    }
                                    disabled={processing || enhancingTitle}
                                />
                            </Field>

                            <Field>
                                <div className="flex items-center justify-between">
                                    <FieldLabel htmlFor="bio">Bio</FieldLabel>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 gap-1.5 text-xs"
                                        disabled={
                                            !data.bio.trim() ||
                                            data.bio === lastEnhancedBio ||
                                            enhancingBio ||
                                            processing
                                        }
                                        onClick={() =>
                                            handleEnhance('bio', data.bio)
                                        }
                                    >
                                        <Sparkles
                                            className={`size-3.5 text-violet-500 ${enhancingBio ? 'animate-pulse' : ''}`}
                                        />
                                        {enhancingBio
                                            ? 'Memproses...'
                                            : 'Tingkatkan dengan AI'}
                                    </Button>
                                </div>
                                <FieldDescription>
                                    Ceritakan tentang dirimu dan pengalamanmu
                                </FieldDescription>
                                <textarea
                                    id="bio"
                                    rows={3}
                                    placeholder="Saya seorang tukang las dengan pengalaman 5 tahun..."
                                    value={data.bio}
                                    onChange={(e) =>
                                        setData('bio', e.target.value)
                                    }
                                    className="w-full min-w-0 rounded-md border border-input bg-card px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 dark:bg-input/30"
                                    disabled={processing || enhancingBio}
                                />
                            </Field>

                            <Field>
                                <div className="flex items-center justify-between">
                                    <FieldLabel>Keahlian</FieldLabel>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 gap-1.5 text-xs"
                                        disabled={
                                            !data.title.trim() ||
                                            !data.bio.trim() ||
                                            data.skills.length > 0 ||
                                            enhancingSkills ||
                                            processing
                                        }
                                        onClick={handleEnhanceSkills}
                                    >
                                        <Sparkles
                                            className={`size-3.5 text-violet-500 ${enhancingSkills ? 'animate-pulse' : ''}`}
                                        />
                                        {enhancingSkills
                                            ? 'Memproses...'
                                            : 'Rekomendasikan Keahlian'}
                                    </Button>
                                </div>
                                <FieldDescription>
                                    Tambahkan keahlian yang kamu miliki
                                </FieldDescription>
                                <Input
                                    placeholder="Contoh: Las, Cat, Listrik"
                                    value={skillInput}
                                    onChange={(e) =>
                                        setSkillInput(e.target.value)
                                    }
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
                                            <Badge
                                                key={skill}
                                                variant="accent"
                                                className="gap-1"
                                            >
                                                {skill}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeSkill(skill)
                                                    }
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
                        <FieldLabel htmlFor="date_of_birth">
                            Tanggal Lahir
                        </FieldLabel>
                        <Popover
                            open={calendarOpen}
                            onOpenChange={setCalendarOpen}
                        >
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    id="date_of_birth"
                                    className="w-full justify-start font-normal"
                                >
                                    <CalendarIcon className="mr-2 size-4" />
                                    {data.date_of_birth
                                        ? format(
                                              new Date(data.date_of_birth),
                                              'dd MMMM yyyy',
                                          )
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
                                    defaultMonth={subYears(new Date(), 18)}
                                    disabled={{
                                        after: subYears(new Date(), 18),
                                    }}
                                    onSelect={(date) => {
                                        if (date) {
                                            setData(
                                                'date_of_birth',
                                                format(date, 'yyyy-MM-dd'),
                                            );
                                        }

                                        setCalendarOpen(false);
                                    }}
                                />
                            </PopoverContent>
                        </Popover>
                    </Field>

                    <Field orientation="vertical">
                        <Field>
                            <FieldLabel htmlFor="province_id">
                                Provinsi
                            </FieldLabel>
                            <Select
                                value={data.province_id}
                                onValueChange={handleProvinceChange}
                                disabled={processing || loadingProvinces}
                            >
                                <SelectTrigger
                                    id="province_id"
                                    className="h-11 w-full"
                                >
                                    <SelectValue
                                        placeholder={
                                            loadingProvinces
                                                ? 'Memuat...'
                                                : 'Pilih Provinsi'
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
                            <FieldLabel htmlFor="regency_id">
                                Kabupaten / Kota
                            </FieldLabel>
                            <Select
                                value={data.regency_id}
                                onValueChange={handleRegencyChange}
                                disabled={
                                    processing ||
                                    loadingRegencies ||
                                    !data.province_id
                                }
                            >
                                <SelectTrigger
                                    id="regency_id"
                                    className="h-11 w-full"
                                >
                                    <SelectValue
                                        placeholder={
                                            loadingRegencies
                                                ? 'Memuat...'
                                                : 'Pilih Kabupaten / Kota'
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
                            onClick={detectLocation}
                            disabled={
                                processing || loadingProvinces || detecting
                            }
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

            <div className="flex w-full flex-col items-center gap-3 sm:items-end">
                <Button
                    type="submit"
                    mobileLarge
                    className="w-full sm:w-auto"
                    disabled={processing || !isProfileComplete}
                >
                    {processing ? 'Menyimpan...' : 'Simpan Profil'}
                </Button>
                <p className="max-w-sm text-center text-xs text-muted-foreground sm:text-right">
                    Dengan mengklik "Simpan Profil", Anda menyatakan bahwa
                    seluruh informasi yang Anda berikan telah dibaca dan
                    dikonfirmasi kebenarannya.
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
