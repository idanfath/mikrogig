// page ini expect user have no pfp, kalo mau direuse nanti jgn lupa update logic

import { useForm, usePage } from '@inertiajs/react';
import { Camera, Trash, User } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import OnboardingLayout from '@/layout/OnboardingLayout';
import { compressImage } from '@/lib/image_utility';
import onboarding from '@/routes/onboarding';
import type { Auth } from '@/types/auth';
import { UserRoleFrontendLabel } from '@/types/enum';

type InertiaPageWithLayout = (() => ReactElement) & {
  layout?: (page: ReactNode) => ReactNode;
};

const OnboardingAvatar: InertiaPageWithLayout = () => {
  const { auth } = usePage<{ auth: Auth }>().props;
  const { setData, post, processing } = useForm({
    avatar: null as File | null,
  });
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(onboarding.avatar.url());
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-1 flex-col items-center gap-4"
    >
      <div className="flex w-full max-w-xl flex-col items-center gap-4 rounded-2xl border border-neutral-100 bg-white p-8 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex gap-4">
          <Avatar className="size-36 border-2 border-dashed border-neutral-200 bg-neutral-50/50 dark:border-neutral-700 dark:bg-neutral-800/50">
            <AvatarImage
              src={preview || undefined}
              alt="Preview avatar"
              className="object-cover"
            />
            <AvatarFallback className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <User className="size-10 text-neutral-400 dark:text-neutral-500" />
              <span className="text-xs font-medium text-neutral-500 select-none dark:text-neutral-400">
                Belum ada foto
              </span>
            </AvatarFallback>
          </Avatar>
          <div className="flex h-full flex-col gap-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                {auth.user.name}
              </p>
              <Badge variant="secondary" className="text-xs">
                {UserRoleFrontendLabel[auth.user.role]}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {auth.user.email}
            </p>
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
            <Camera /> {preview ? 'Ganti Foto' : 'Pilih Foto'}
          </Button>
          {preview && (
            <>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  setPreview(null);
                  setData('avatar', null);
                }}
              >
                <Trash /> Hapus Foto
              </Button>
            </>
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
          Pastikan wajah terlihat jelas. Ukuran maksimal 2MB. Foto
          profil kamu bisa diubah kapan saja di pengaturan akun.
        </p>
      </div>

      <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="w-full max-sm:py-7 sm:w-auto"
          onClick={() => post(onboarding.skip.url())}
          disabled={processing}
        >
          Nanti Saja
        </Button>
        <Button
          type="submit"
          className="w-full max-sm:py-7 sm:w-auto"
          disabled={processing || !preview}
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
