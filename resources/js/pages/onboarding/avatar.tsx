import { useForm, usePage } from '@inertiajs/react';
import { Camera, Trash } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import OnboardingLayout from '@/layout/OnboardingLayout';
import { compressImage } from '@/lib/image_utility';
import onboarding from '@/routes/onboarding';
import type { Auth } from '@/types/auth';
import { UserRoleFrontendLabel } from '@/types/enum';

const OnboardingAvatar: InertiaPageWithLayout = () => {
  const { auth } = usePage<{ auth: Auth }>().props;
  const { data, setData, post, processing } = useForm({
    avatar: null as File | null,
  });
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const hasCustomAvatar = Boolean(
    auth.user.avatar && !auth.user.avatar.includes('default_avatar'),
  );
  const existingUrl = hasCustomAvatar ? auth.user.avatar_url : undefined;
  const displayUrl = preview ?? existingUrl;
  const hasNewFile = data.avatar != null;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;

    if (!file) {
      setData('avatar', null);
      setPreview(null);

      return;
    }

    setPreview(URL.createObjectURL(file));

    const compressed = await compressImage(
      file,
      'profile_picture',
      undefined,
      false,
      512 * 1024,
    );

    setData('avatar', compressed);
  };

  const clearNewSelection = () => {
    setPreview(null);
    setData('avatar', null);
    if (fileRef.current) {
      fileRef.current.value = '';
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    if (hasNewFile) {
      post(onboarding.avatar.url());
      return;
    }

    if (hasCustomAvatar) {
      post(onboarding.skip.url());
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-1 flex-col items-center gap-4">
      <div className="flex w-full max-w-xl flex-col items-center gap-4 rounded-2xl border border-neutral-100 bg-white p-8 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex gap-4">
          <UserAvatar
            user={{ name: auth.user.name, avatar_url: displayUrl }}
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

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileRef.current?.click()}
          >
            <Camera /> {displayUrl ? 'Ganti Foto' : 'Pilih Foto'}
          </Button>
          {hasNewFile && (
            <Button
              type="button"
              variant="destructive"
              onClick={clearNewSelection}
            >
              <Trash /> Hapus Foto
            </Button>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
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
          onClick={() => post(onboarding.skip.url())}
          disabled={processing}
        >
          Nanti Saja
        </Button>
        <Button
          type="submit"
          mobileLarge
          className="w-full sm:w-auto"
          disabled={processing || (!hasNewFile && !hasCustomAvatar)}
        >
          {processing ? 'Menyimpan...' : 'Terapkan'}
        </Button>
      </div>
    </form>
  );
};

OnboardingAvatar.layout = (page: ReactNode) => (
  <OnboardingLayout
    title="Tambahkan foto profil Anda"
    description="Foto yang jelas membuat profil Anda lebih dipercaya oleh pengguna lain di MikroGig."
  >
    {page}
  </OnboardingLayout>
);

export default OnboardingAvatar;
