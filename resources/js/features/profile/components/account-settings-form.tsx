import { Form } from '@inertiajs/react';
import { Eye, EyeOff, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { AppPageCard } from '@/components/layout/app-page';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { sentenceCase } from '@/lib/utils';
import app from '@/routes/app';

type AccountSettingsFormProps = {
  hasPassword: boolean;
};

export function AccountSettingsForm({ hasPassword }: AccountSettingsFormProps) {
  const title = hasPassword ? 'Ubah Password' : 'Atur Password';

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <AppPageCard>
      <Form
        action={app.account.password.url()}
        method="put"
        className="flex flex-col gap-6"
        options={{ preserveScroll: true }}
        resetOnSuccess
      >
        {({ errors, processing, resetAndClearErrors }) => (
          <>
            <div className="flex items-center gap-3 pb-4 border-b border-border/60">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <KeyRound className="size-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground leading-tight">
                  {title}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {hasPassword
                    ? 'Pastikan password baru Anda kuat dan belum pernah digunakan sebelumnya.'
                    : 'Buat password untuk mengamankan akses masuk akun Anda.'}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {hasPassword && (
                <Field data-invalid={!!errors.current_password}>
                  <FieldLabel htmlFor="current_password">
                    Password Saat Ini
                  </FieldLabel>
                  <InputGroup mobileLarge>
                    <InputGroupAddon align="inline-start">
                      <Lock className="size-4 text-muted-foreground" />
                    </InputGroupAddon>
                    <InputGroupInput
                      id="current_password"
                      name="current_password"
                      type={showCurrentPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      required
                      aria-invalid={!!errors.current_password}
                      mobileLarge
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        title={showCurrentPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  <FieldError>
                    {sentenceCase(errors.current_password)}
                  </FieldError>
                </Field>
              )}

              <Field data-invalid={!!errors.password}>
                <FieldLabel htmlFor="password">Password Baru</FieldLabel>
                <InputGroup mobileLarge>
                  <InputGroupAddon align="inline-start">
                    <Lock className="size-4 text-muted-foreground" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="password"
                    name="password"
                    type={showNewPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    required
                    aria-invalid={!!errors.password}
                    mobileLarge
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      title={showNewPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    >
                      {showNewPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                <FieldDescription className="text-xs">
                  Minimal 8 karakter. Kombinasikan huruf besar, angka, dan simbol untuk keamanan ekstra.
                </FieldDescription>
                <FieldError>{sentenceCase(errors.password)}</FieldError>
              </Field>

              <Field data-invalid={!!errors.password_confirmation}>
                <FieldLabel htmlFor="password_confirmation">
                  Konfirmasi Password Baru
                </FieldLabel>
                <InputGroup mobileLarge>
                  <InputGroupAddon align="inline-start">
                    <ShieldCheck className="size-4 text-muted-foreground" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="password_confirmation"
                    name="password_confirmation"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    required
                    aria-invalid={!!errors.password_confirmation}
                    mobileLarge
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      title={showConfirmPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                <FieldError>
                  {sentenceCase(errors.password_confirmation)}
                </FieldError>
              </Field>

              <div className="flex w-full flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  disabled={processing}
                  onClick={() => resetAndClearErrors()}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="w-full sm:w-auto"
                  disabled={processing}
                >
                  {processing ? 'Menyimpan...' : 'Simpan Password'}
                </Button>
              </div>
            </div>
          </>
        )}
      </Form>
    </AppPageCard>
  );
}
