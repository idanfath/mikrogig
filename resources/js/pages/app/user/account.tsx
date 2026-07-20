import { Form, Head } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { AppPage, AppPageCard } from '@/components/layout/app-page';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layout/AppLayout';
import { sentenceCase } from '@/lib/utils';
import app from '@/routes/app';

type Props = {
  hasPassword: boolean;
};

const AccountPage: InertiaPageWithLayout<Props> = ({ hasPassword }) => {
  const title = hasPassword ? 'Ubah password' : 'Atur password';

  return (
    <>
      <Head title="Akun" />
      <AppPage
        title="Akun"
        description={
          hasPassword
            ? 'Ganti password akun kamu.'
            : 'Atur password agar bisa masuk tanpa Google.'
        }
      >
        <AppPageCard>
          <h2 className="mb-4 text-base font-medium">{title}</h2>
          <Form
            action={app.account.password.url()}
            method="put"
            className="flex flex-col gap-4"
            options={{ preserveScroll: true }}
            resetOnSuccess
          >
            {({ errors, processing }) => (
              <>
                {hasPassword ? (
                  <Field data-invalid={!!errors.current_password}>
                    <FieldLabel htmlFor="current_password">
                      Password saat ini
                    </FieldLabel>
                    <Input
                      id="current_password"
                      name="current_password"
                      type="password"
                      autoComplete="current-password"
                      required
                      aria-invalid={!!errors.current_password}
                    />
                    <FieldError>
                      {sentenceCase(errors.current_password)}
                    </FieldError>
                  </Field>
                ) : null}

                <Field data-invalid={!!errors.password}>
                  <FieldLabel htmlFor="password">Password baru</FieldLabel>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    aria-invalid={!!errors.password}
                  />
                  <FieldDescription>
                    Gunakan password yang kuat dan unik.
                  </FieldDescription>
                  <FieldError>
                    {sentenceCase(errors.password)}
                  </FieldError>
                </Field>

                <Field data-invalid={!!errors.password_confirmation}>
                  <FieldLabel htmlFor="password_confirmation">
                    Konfirmasi password baru
                  </FieldLabel>
                  <Input
                    id="password_confirmation"
                    name="password_confirmation"
                    type="password"
                    autoComplete="new-password"
                    required
                    aria-invalid={!!errors.password_confirmation}
                  />
                  <FieldError>
                    {sentenceCase(errors.password_confirmation)}
                  </FieldError>
                </Field>

                <Button type="submit" disabled={processing} className="self-start">
                  {processing ? 'Menyimpan...' : title}
                </Button>
              </>
            )}
          </Form>
        </AppPageCard>
      </AppPage>
    </>
  );
};

AccountPage.layout = (page: ReactNode) => (
  <AppLayout title="Akun">{page}</AppLayout>
);

export default AccountPage;
