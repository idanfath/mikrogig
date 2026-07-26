import type { Options } from 'browser-image-compression';
import imageCompression from 'browser-image-compression';
import toast from 'react-hot-toast';
import type {
  CompressionLevelType,
  CompressionProfileType,
} from '@/types/client_enum';
import { getDeviceInformation } from './utils';

const compressionProfiles: Record<
  CompressionProfileType,
  Record<CompressionLevelType, Options>
> = {
  profile_picture: {
    high: {
      preserveExif: false,
      maxSizeMB: 1,
      maxWidthOrHeight: 512,
    },
    medium: {
      preserveExif: false,
      maxSizeMB: 1.5,
      maxWidthOrHeight: 1024,
    },
    low: {
      preserveExif: false,
      maxSizeMB: 2.5,
      maxWidthOrHeight: 2048,
    },
  },
  gig_photo: {
    high: {
      preserveExif: false,
      maxSizeMB: 2,
      maxWidthOrHeight: 1920,
    },
    medium: {
      preserveExif: false,
      maxSizeMB: 3,
      maxWidthOrHeight: 1920,
    },
    low: {
      preserveExif: false,
      maxSizeMB: 4.5,
      maxWidthOrHeight: 1920,
    },
  },
};

export function categorizeDeviceCapabilities(): CompressionLevelType {
  const { memory, cores } = getDeviceInformation();

  if (cores) {
    if (cores >= 8) {
      return 'high';
    } else if (cores >= 4) {
      return 'medium';
    }
  }

  if (memory) {
    if (memory >= 8) {
      return 'high';
    } else if (memory >= 4) {
      return 'medium';
    }
  }

  return 'low';
}

export async function compressImage(
  file: File,
  profile: CompressionProfileType,
  onProgress?: (progress: number) => void,
  doToast: boolean = false,
  minSizeBytes: number = 0,
): Promise<File> {
  try {
    let level: CompressionLevelType;

    try {
      level = categorizeDeviceCapabilities();
    } catch (error) {
      console.warn(
        'Failed to get device information for categorization, defaulting to medium compression.',
        error,
      );
      level = 'medium' as CompressionLevelType;
    }

    const profileOptions = compressionProfiles[profile]?.[level];

    if (!profileOptions) {
      throw new Error(
        `Compression profile "${profile}" with level "${level}" not found.`,
      );
    }

    const skipQualityCompression = minSizeBytes > 0 && file.size < minSizeBytes;

    if (doToast) {
      toast.loading(`Mengompres gambar...`);
    }

    const compressedBlob = await imageCompression(file, {
      useWebWorker: true,
      onProgress: onProgress,
      ...profileOptions,
      ...(skipQualityCompression && {
        maxSizeMB: file.size / (1024 * 1024) + 1,
      }),
    });

    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = file.name.includes('.') ? file.name : `image.${extension}`;
    const compressed = new File([compressedBlob], fileName, {
      type: compressedBlob.type || file.type,
      lastModified: Date.now(),
    });

    if (doToast) {
      toast.success(`Gambar berhasil dikompres.`);
    }

    return compressed;
  } catch (error) {
    if (doToast) {
      toast.error('Gagal mengompres gambar.');
    }

    throw error;
  } finally {
    if (doToast) {
      toast.dismiss();
    }
  }
}

export function getImageSizeHuman(
  size: number | File | { size?: number },
): string {
  const bytes =
    typeof size === 'number'
      ? size
      : typeof size === 'object' && size !== null && typeof size.size === 'number'
        ? size.size
        : 0;

  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  } else {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
}

export function getSizeComparisonHuman(original: File, compressed: File) {
  const sizeDifference = original.size - compressed.size;
  const savingsPercentage = (
    (1 - compressed.size / original.size) *
    100
  ).toFixed(1);

  return {
    saved_percentage: `${savingsPercentage}%`,
    saved_size: getImageSizeHuman(sizeDifference),
  };
}

export function downloadLocallyAvailableImage(
  file: File,
  originalName?: string,
  doToast: boolean = false,
) {
  const downloadName = originalName
    ? originalName.replace(/\.(\w+)$/, '-compressed.$1')
    : file.name;
  const blobUrl = URL.createObjectURL(file);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = downloadName;
  anchor.click();
  URL.revokeObjectURL(blobUrl);

  if (doToast) {
    toast.success(`${downloadName} berhasil diunduh.`);
  }
}
