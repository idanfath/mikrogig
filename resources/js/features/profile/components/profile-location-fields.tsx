import { subYears } from 'date-fns';
import { Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PrivacyTooltip } from './privacy-tooltip';

type RegionOption = {
  id: string;
  name: string;
};

type ProfileLocationFieldsProps = {
  dateOfBirth: string;
  provinceId: string;
  regencyId: string;
  errors: {
    date_of_birth?: string;
    province_id?: string;
    regency_id?: string;
  };
  processing: boolean;
  calendarOpen: boolean;
  onCalendarOpenChange: (open: boolean) => void;
  maxDateOfBirth: string | null;
  provinces: RegionOption[];
  regencies: RegionOption[];
  loadingProvinces: boolean;
  loadingRegencies: boolean;
  detecting: boolean;
  onDateOfBirthChange: (value: string) => void;
  onProvinceChange: (provinceId: string) => void;
  onRegencyChange: (regencyId: string) => void;
  onDetectLocation: () => void;
};

function ProfileLocationFields({
  dateOfBirth,
  provinceId,
  regencyId,
  errors,
  processing,
  calendarOpen,
  onCalendarOpenChange,
  maxDateOfBirth,
  provinces,
  regencies,
  loadingProvinces,
  loadingRegencies,
  detecting,
  onDateOfBirthChange,
  onProvinceChange,
  onRegencyChange,
  onDetectLocation,
}: ProfileLocationFieldsProps) {
  const selectedBirthDate = dateOfBirth ? new Date(dateOfBirth) : undefined;
  const maximumBirthDate = maxDateOfBirth
    ? new Date(maxDateOfBirth)
    : subYears(new Date(), 18);
  const defaultBirthMonth = selectedBirthDate ?? maximumBirthDate;

  return (
    <>
      <Field data-invalid={Boolean(errors.date_of_birth)}>
        <div className="flex items-center gap-1">
          <FieldLabel htmlFor="date_of_birth">Tanggal lahir</FieldLabel>
          <PrivacyTooltip />
        </div>
        <DatePicker
          id="date_of_birth"
          value={dateOfBirth}
          onChange={onDateOfBirthChange}
          disabled={processing}
          maxDate={maximumBirthDate}
          captionLayout="dropdown"
          defaultMonth={defaultBirthMonth}
          placeholder="Pilih tanggal lahir"
          mobileLarge
        />
        <FieldError>{errors.date_of_birth}</FieldError>
      </Field>
      <Field data-invalid={Boolean(errors.province_id)}>
        <FieldLabel htmlFor="province_id">Provinsi</FieldLabel>
        <Select
          value={provinceId}
          onValueChange={(val) => {
            if (!val && loadingProvinces) {
              return;
            }

            onProvinceChange(val);
          }}
          disabled={processing || loadingProvinces}
        >
          <SelectTrigger id="province_id" className="w-full" mobileLarge>
            <SelectValue
              placeholder={loadingProvinces ? 'Memuat...' : 'Pilih provinsi'}
            />
          </SelectTrigger>
          <SelectContent position="popper">
            {provinces.map((province) => (
              <SelectItem key={province.id} value={province.id}>
                {province.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError>{errors.province_id}</FieldError>
      </Field>
      <Field data-invalid={Boolean(errors.regency_id)}>
        <FieldLabel htmlFor="regency_id">Kabupaten / Kota</FieldLabel>
        <Select
          value={regencyId}
          onValueChange={(val) => {
            // do not remove: prevents radix ui from auto-clearing regency_id to empty string when options list is loading or updating
            if (
              !val &&
              (loadingRegencies ||
                (regencyId !== '' &&
                  !regencies.some((r) => r.id === regencyId)))
            ) {
              return;
            }

            onRegencyChange(val);
          }}
          disabled={processing || loadingRegencies || !provinceId}
        >
          <SelectTrigger id="regency_id" className="w-full" mobileLarge>
            <SelectValue
              placeholder={
                loadingRegencies ? 'Memuat...' : 'Pilih kabupaten / kota'
              }
            />
          </SelectTrigger>
          <SelectContent position="popper">
            {regencies.map((regency) => (
              <SelectItem key={regency.id} value={regency.id}>
                {regency.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError>{errors.regency_id}</FieldError>
      </Field>
      <Field>
        <Button
          type="button"
          variant="outline"
          onClick={onDetectLocation}
          disabled={processing || loadingProvinces || detecting}
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
          {detecting ? 'Mendeteksi Lokasi...' : 'Deteksi Lokasi Otomatis (GPS)'}
        </Button>
      </Field>
    </>
  );
}

export { ProfileLocationFields };
