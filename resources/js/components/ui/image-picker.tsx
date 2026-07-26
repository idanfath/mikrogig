import { ImagePlus, LoaderCircle, Trash2 } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { imageAccept, useImageSelection } from '@/hooks/use-image-selection';
import { getImageSizeHuman } from '@/lib/image_utility';
import { cn } from '@/lib/utils';

type ImagePickerProps = {
  files: File[];
  onFilesChange: (files: File[]) => void;
  label: string;
  description?: string;
  error?: string;
  maxFiles?: number;
  maxBytes?: number;
  maxDimensions?: { width: number; height: number };
  disabled?: boolean;
  transformFile?: (file: File) => Promise<File>;
  className?: string;
};

function ImagePicker({
  files,
  onFilesChange,
  label,
  description,
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

  return (
    <div className={cn('grid gap-3', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1">
          <p className="text-sm font-medium">{label}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={isDisabled}
        >
          {isProcessing ? (
            <LoaderCircle className="animate-spin" data-icon="inline-start" />
          ) : (
            <ImagePlus data-icon="inline-start" />
          )}
          {isProcessing
            ? 'Mengoptimalkan...'
            : files.length === 0
              ? 'Pilih foto'
              : 'Tambah foto'}
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

      {items.length > 0 && (
        <PhotoProvider>
          <div className="flex flex-wrap items-start gap-3" role="list">
            {items.map((item, index) => (
              <Attachment
                key={item.previewUrl}
                orientation="vertical"
                className="w-36 sm:w-44 shrink-0"
                role="listitem"
              >
                <AttachmentMedia variant="image" className="cursor-pointer">
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
                    onClick={() => remove(index)}
                    disabled={isProcessing || disabled}
                    aria-label={`Hapus foto ${index + 1}`}
                  >
                    <Trash2 className="size-3.5 text-white" />
                  </AttachmentAction>
                </AttachmentActions>
              </Attachment>
            ))}
          </div>
        </PhotoProvider>
      )}
    </div>
  );
}

export { ImagePicker };
