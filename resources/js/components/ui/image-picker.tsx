import { ImagePlus, LoaderCircle, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';
import {
    Attachment,
    AttachmentAction,
    AttachmentActions,
    AttachmentContent,
    AttachmentDescription,
    AttachmentMedia,
    AttachmentTitle,
} from '@/components/ui/attachment';
import { Button, buttonVariants } from '@/components/ui/button';
import {
    imageAccept,
    useImageSelection,
    type ImageSelectionItem,
} from '@/hooks/use-image-selection';
import { getImageSizeHuman } from '@/lib/image_utility';
import { cn } from '@/lib/utils';
import type { VariantProps } from 'class-variance-authority';

type ImagePickerProps = {
    files: File[];
    onFilesChange: (files: File[]) => void;
    label?: string;
    description?: string;
    buttonLabel?: string;
    showButtonLabel?: boolean;
    icon?: ReactNode;
    buttonVariant?: VariantProps<typeof buttonVariants>['variant'];
    buttonSize?: VariantProps<typeof buttonVariants>['size'];
    error?: string;
    maxFiles?: number;
    maxBytes?: number;
    maxDimensions?: { width: number; height: number };
    disabled?: boolean;
    transformFile?: (file: File) => Promise<File>;
    className?: string;
};

type ImagePickerPreviewListProps = {
    items: ImageSelectionItem[];
    onRemove: (index: number) => void;
    disabled?: boolean;
    variant?: 'default' | 'compact';
};

function ImagePickerPreviewList({
    items,
    onRemove,
    disabled = false,
    variant = 'default',
}: ImagePickerPreviewListProps) {
    if (items.length === 0) {
        return null;
    }

    const isCompact = variant === 'compact';
    const attachments = items.map((item, index) => (
        <Attachment
            key={item.previewUrl}
            size={isCompact ? 'sm' : 'default'}
            orientation={isCompact ? 'horizontal' : 'vertical'}
            className='w-36  sm:w-44 rounded-md'
            role="listitem"
        >
            <AttachmentMedia
                variant="image"
                className={cn('cursor-pointer', isCompact && 'rounded-sm')}
            >
                <PhotoView src={item.previewUrl}>
                    <img
                        src={item.previewUrl}
                        alt={`Pratinjau foto ${index + 1}`}
                        className="cursor-pointer"
                    />
                </PhotoView>
            </AttachmentMedia>
            <AttachmentContent>
                <AttachmentTitle>{item.file.name}</AttachmentTitle>
                <AttachmentDescription>
                    {getImageSizeHuman(item.file)}
                </AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
                <AttachmentAction
                    type="button"
                    variant="destructive"
                    className="bg-destructive text-white shadow-xs hover:bg-destructive/90"
                    onClick={() => onRemove(index)}
                    disabled={disabled}
                    aria-label={`Hapus foto ${index + 1}`}
                >
                    <Trash2 data-icon="inline-start" />
                </AttachmentAction>
            </AttachmentActions>
        </Attachment>
    ));

    return (
        <PhotoProvider>
            {isCompact ? (
                <div
                    className="flex min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-2 py-1 scrollbar-none *:data-[slot=attachment]:flex-none *:data-[slot=attachment]:snap-start"
                    role="list"
                >
                    {attachments}
                </div>
            ) : (
                <div className="flex flex-wrap items-start gap-3" role="list">
                    {attachments}
                </div>
            )}
        </PhotoProvider>
    );
}

function ImagePicker({
    files,
    onFilesChange,
    label,
    description,
    buttonLabel,
    showButtonLabel = true,
    icon,
    buttonVariant = 'outline',
    buttonSize,
    error,
    maxFiles = 1,
    maxBytes,
    maxDimensions,
    disabled,
    transformFile,
    className,
}: ImagePickerProps) {
    const {
        handleFileChange,
        inputRef,
        isDisabled,
        isProcessing,
        items,
        remove,
        selectionError,
    } = useImageSelection({
        files,
        onFilesChange,
        maxFiles,
        maxBytes,
        maxDimensions,
        disabled,
        transformFile,
    });

    const buttonText =
        buttonLabel !== undefined
            ? buttonLabel
            : files.length === 0
                ? 'Pilih foto'
                : 'Tambah foto';

    const defaultIcon = <ImagePlus data-icon="inline-start" />;
    const renderIcon = icon ?? defaultIcon;
    const computedSize =
        buttonSize ?? (showButtonLabel === false ? 'icon' : 'default');

    return (
        <div className={cn('grid gap-3', className)}>
            {(label || description) && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="grid gap-1">
                        {label && <p className="text-sm font-medium">{label}</p>}
                        {description && (
                            <p className="text-xs text-muted-foreground">{description}</p>
                        )}
                    </div>
                </div>
            )}

            <div>
                <Button
                    type="button"
                    variant={buttonVariant}
                    size={computedSize}
                    onClick={() => inputRef.current?.click()}
                    disabled={isDisabled}
                    title={label ?? 'Lampirkan foto'}
                >
                    {isProcessing ? (
                        <LoaderCircle className="animate-spin" data-icon="inline-start" />
                    ) : (
                        renderIcon
                    )}
                    {showButtonLabel && !isProcessing && buttonText && (
                        <span>{buttonText}</span>
                    )}
                </Button>
                <input
                    ref={inputRef}
                    type="file"
                    accept={imageAccept}
                    multiple={maxFiles > 1}
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>

            {(error || selectionError) && (
                <p className="text-sm text-destructive" aria-live="polite">
                    {error ?? selectionError}
                </p>
            )}

            <ImagePickerPreviewList
                items={items}
                onRemove={remove}
                disabled={isProcessing || disabled}
            />
        </div>
    );
}

export { ImagePicker, ImagePickerPreviewList };
