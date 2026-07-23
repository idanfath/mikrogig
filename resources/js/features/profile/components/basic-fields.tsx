import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ProfileLocationFields } from './profile-location-fields';

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
    loadingProvinces,
    loadingRegencies,
    detecting,
    onNameChange,
    onDateOfBirthChange,
    onProvinceChange,
    onRegencyChange,
    onDetectLocation,
}: BasicFieldsProps) {
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
            <ProfileLocationFields
                dateOfBirth={dateOfBirth}
                provinceId={provinceId}
                regencyId={regencyId}
                errors={errors}
                processing={processing}
                calendarOpen={calendarOpen}
                onCalendarOpenChange={onCalendarOpenChange}
                maxDateOfBirth={maxDateOfBirth}
                provinces={provinces}
                regencies={regencies}
                loadingProvinces={loadingProvinces}
                loadingRegencies={loadingRegencies}
                detecting={detecting}
                onDateOfBirthChange={onDateOfBirthChange}
                onProvinceChange={onProvinceChange}
                onRegencyChange={onRegencyChange}
                onDetectLocation={onDetectLocation}
            />
        </FieldGroup>
    );
}

export { BasicFields };
