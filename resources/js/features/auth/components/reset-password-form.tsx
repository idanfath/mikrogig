import { Form } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import password from '@/routes/password';
import { sentenceCase } from '@/lib/utils';

interface ResetPasswordFormProps {
  token: string;
  email: string;
}

export function ResetPasswordForm({ token, email }: ResetPasswordFormProps) {
  return (
    <Form
      action={password.reset.submit.url()}
      method="post"
      className="w-full max-w-xl p-6"
    >
      {({ errors, processing }) => (
        <>
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="email" value={email} />

          <Field className="mb-4" data-invalid={!!errors.password}>
            <FieldLabel htmlFor="password">Password Baru</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              required
              aria-invalid={!!errors.password}
              mobileLarge
            />
            <FieldDescription>Masukkan password baru Anda.</FieldDescription>
            <FieldError>{sentenceCase(errors.password)}</FieldError>
          </Field>

          <Field
            className="mb-4"
            data-invalid={!!errors.password_confirmation}
          >
            <FieldLabel htmlFor="password_confirmation">
              Konfirmasi Password Baru
            </FieldLabel>
            <Input
              id="password_confirmation"
              name="password_confirmation"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              required
              aria-invalid={!!errors.password_confirmation}
              mobileLarge
            />
            <FieldDescription>Ulangi password baru Anda.</FieldDescription>
            <FieldError>
              {sentenceCase(errors.password_confirmation)}
            </FieldError>
          </Field>

          <Button
            type="submit"
            className="w-full"
            disabled={processing}
            mobileLarge
          >
            {processing ? 'Memproses...' : 'Reset Password'}
          </Button>
        </>
      )}
    </Form>
  );
}
