import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import type { Matcher } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type DatePickerProps = {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    minDate?: Date;
    maxDate?: Date;
    disabledMatcher?: Matcher | Matcher[];
    className?: string;
    id?: string;
    captionLayout?: "label" | "dropdown" | "dropdown-months" | "dropdown-years";
    defaultMonth?: Date;
    mobileLarge?: boolean;
};

export function DatePicker({
    value,
    onChange,
    placeholder = 'Pilih tanggal',
    disabled = false,
    minDate,
    maxDate,
    disabledMatcher,
    className,
    id: elementId,
    captionLayout,
    defaultMonth,
    mobileLarge = false,
}: DatePickerProps) {
    const [open, setOpen] = useState(false);

    const selectedDate = value ? parseISO(value) : undefined;

    const disabledRules: Matcher[] = [];
    if (minDate) disabledRules.push({ before: minDate });
    if (maxDate) disabledRules.push({ after: maxDate });
    if (disabledMatcher) {
        if (Array.isArray(disabledMatcher)) {
            disabledRules.push(...disabledMatcher);
        } else {
            disabledRules.push(disabledMatcher);
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    id={elementId}
                    disabled={disabled}
                    className={cn(
                        'w-full justify-start font-normal md:text-sm',
                        !mobileLarge && 'h-9',
                        mobileLarge && 'h-9 max-sm:h-11! max-sm:px-4 max-sm:text-base',
                        !selectedDate && 'text-muted-foreground',
                        className,
                    )}
                >
                    <CalendarIcon className={'opacity-50'} />
                    {selectedDate
                        ? format(selectedDate, 'dd MMMM yyyy', { locale: id })
                        : placeholder}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    captionLayout={"dropdown"}
                    defaultMonth={defaultMonth ?? selectedDate}
                    disabled={disabledRules.length > 0 ? disabledRules : undefined}
                    onSelect={(date) => {
                        if (date) {
                            onChange?.(format(date, 'yyyy-MM-dd'));
                        } else {
                            onChange?.('');
                        }
                        setOpen(false);
                    }}
                />
            </PopoverContent>
        </Popover>
    );
}
