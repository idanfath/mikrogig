import { useState } from 'react';
import { useImageSelection } from '@/hooks/use-image-selection';
import { compressImage } from '@/lib/image_utility';
import { CompressionProfiles } from '@/types/client_enum';

type UseAvatarSelectionOptions = {
  existingUrl?: string;
  onFileChange: (file: File) => void;
};

export function useAvatarSelection({
  existingUrl,
  onFileChange,
}: UseAvatarSelectionOptions) {
  const [files, setFiles] = useState<File[]>([]);
  const selection = useImageSelection({
    files,
    onFilesChange: (nextFiles) => {
      setFiles(nextFiles);

      if (nextFiles[0]) {
        onFileChange(nextFiles[0]);
      }
    },
    maxFiles: 1,
    maxBytes: 5 * 1024 * 1024,
    transformFile: (file) =>
      compressImage(
        file,
        CompressionProfiles.ProfilePicture,
        undefined,
        false,
        512 * 1024,
      ),
  });

  return {
    inputRef: selection.inputRef,
    displayedUrl: selection.items[0]?.previewUrl ?? existingUrl,
    hasSelection: files.length > 0,
    isProcessing: selection.isProcessing,
    selectionError: selection.selectionError,
    handleFileChange: selection.handleFileChange,
    clearSelection: selection.clear,
  };
}
