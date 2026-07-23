import type { ChangeEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { compressImage } from '@/lib/image_utility';

type UseAvatarSelectionOptions = {
  existingUrl?: string;
  onFileChange: (file: File) => void;
};

export function useAvatarSelection({
  existingUrl,
  onFileChange,
}: UseAvatarSelectionOptions) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const clearSelection = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setPreviewUrl(null);

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  useEffect(() => clearSelection, []);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const compressed = await compressImage(
        file,
        'profile_picture',
        undefined,
        false,
        512 * 1024,
      );
      const nextPreviewUrl = URL.createObjectURL(compressed);

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }

      previewUrlRef.current = nextPreviewUrl;
      setPreviewUrl(nextPreviewUrl);
      onFileChange(compressed);
    } catch {
      toast.error('Gagal mengompres gambar.');
    } finally {
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return {
    inputRef,
    displayedUrl: previewUrl ?? existingUrl,
    hasSelection: previewUrl !== null,
    handleFileChange,
    clearSelection,
  };
}
