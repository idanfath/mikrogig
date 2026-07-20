import { format, subYears } from 'date-fns';
import { id } from 'date-fns/locale';
import { CalendarIcon, Loader2, MapPin } from 'lucide-react';
import { PrivacyTooltip } from '@/components/profile/privacy-tooltip';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Field,
  FieldError,
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

type RegionOption = {
  id: string;
  name: string;
};

type BasicFieldsProps = {
  name: string;
  dateOfBirth: string;
  provinceId: string;
  regencyId: string;
  errors: {
    name?: string;
    date_of_birth?: string;
  };
  processing: boolean;
  calendarOpen: boolean;
  onCalendarOpenChange: (open: boolean) => void;
  maxDateOfBirth: string | null;
  provinces: RegionOption[];
  regencies: RegionOption[];
  loadingRegencies: boolean;
  detecting: boolean;
  onNameChange: (value: string) => void;
  onDateOfBirthChange: (value: string) => void;
  onProvinceChange: (provinceId: string) => void;
  onRegencyChange: (regencyId: string) => void;
  onDetectLocation: () => void;
};

function BasicFields({
  name,
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
  loadingRegencies,
  detecting,
  onNameChange,
  onDateOfBirthChange,
  onProvinceChange,
  onRegencyChange,
  onDetectLocation,
}: BasicFieldsProps) {
  const selectedBirthDate = dateOfBirth ? new Date(dateOfBirth) : undefined;
  const defaultBirthMonth =
    selectedBirthDate ??
    (maxDateOfBirth ? new Date(maxDateOfBirth) : subYears(new Date(), 18));

  return (
    <FieldGroup>
      <Field data-invalid={Boolean(errors.name)}>
        <FieldLabel htmlFor="name">Nama</FieldLabel>
        <Input
          id="name"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          aria-invalid={Boolean(errors.name)}
          disabled={processing}
        />
        <FieldError>{errors.name}</FieldError>
      </Field>
      <Field data-invalid={Boolean(errors.date_of_birth)}>
        <div className="flex items-center gap-1">
          <FieldLabel htmlFor="date_of_birth">Tanggal lahir</FieldLabel>
          <PrivacyTooltip />
        </div>
        <Popover open={calendarOpen} onOpenChange={onCalendarOpenChange}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              id="date_of_birth"
              className="w-full justify-start font-normal"
              disabled={processing}
            >
              <CalendarIcon data-icon="inline-start" />
              {selectedBirthDate
                ? format(selectedBirthDate, 'dd MMMM yyyy', { locale: id })
                : 'Pilih tanggal lahir'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedBirthDate}
              captionLayout="dropdown"
              defaultMonth={defaultBirthMonth}
              disabled={{ after: defaultBirthMonth }}
              onSelect={(date) => {
                if (date) {
                  onDateOfBirthChange(
                    format(date, 'yyyy-MM-dd', { locale: id }),
                  );
                }

                onCalendarOpenChange(false);
              }}
            />
          </PopoverContent>
        </Popover>
        <FieldError>{errors.date_of_birth}</FieldError>
      </Field>
      <Field>
        <FieldLabel htmlFor="province_id">Provinsi</FieldLabel>
        <Select
          value={provinceId}
          onValueChange={onProvinceChange}
          disabled={processing}
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
          value={regencyId}
          onValueChange={onRegencyChange}
          disabled={processing || loadingRegencies || !provinceId}
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
          onClick={onDetectLocation}
          disabled={processing || detecting}
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
  );
}

export { BasicFields };
