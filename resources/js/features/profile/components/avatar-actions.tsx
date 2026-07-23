import { Camera, Trash } from 'lucide-react';
import type { ChangeEvent, RefObject } from 'react';
import { Button } from '@/components/ui/button';

type AvatarActionsProps = {
    fileInputRef: RefObject<HTMLInputElement | null>;
    processing: boolean;
    hasAvatar: boolean;
    canRemove: boolean;
    onSelect: (event: ChangeEvent<HTMLInputElement>) => void;
    onRemove: () => void;
};

function AvatarActions({
    fileInputRef,
    processing,
    hasAvatar,
    canRemove,
    onSelect,
    onRemove,
}: AvatarActionsProps) {
    return (
        <div className="flex flex-wrap gap-2">
            <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={processing}
            >
                <Camera data-icon="inline-start" />
                {hasAvatar ? 'Ganti foto' : 'Pilih foto'}
            </Button>
            {canRemove && (
                <Button
                    type="button"
                    variant="outline"
                    onClick={onRemove}
                    disabled={processing}
                >
                    <Trash data-icon="inline-start" />
                    Hapus foto
                </Button>
            )}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={onSelect}
            />
        </div>
    );
}

export { AvatarActions };
