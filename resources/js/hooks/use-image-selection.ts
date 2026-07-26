import type { ChangeEvent, RefObject } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export const imageAccept = 'image/jpeg,image/png,image/webp';

const imageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

function getFileKey(file: File): string {
    return `${file.name}-${file.size}-${file.lastModified}`;
}

type ImageDimensions = {
    width: number;
    height: number;
};

export type ImageSelectionItem = {
    file: File;
    previewUrl: string;
};

type UseImageSelectionOptions = {
    files: File[];
    onFilesChange: (files: File[]) => void;
    maxFiles?: number;
    maxBytes?: number;
    maxDimensions?: ImageDimensions;
    disabled?: boolean;
    transformFile?: (file: File) => Promise<File>;
};

function readImageDimensions(file: File): Promise<ImageDimensions> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        const url = URL.createObjectURL(file);

        image.onload = () => {
            URL.revokeObjectURL(url);
            resolve({ width: image.naturalWidth, height: image.naturalHeight });
        };
        image.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Gambar tidak dapat dibaca.'));
        };
        image.src = url;
    });
}

export function useImageSelection({
    files,
    onFilesChange,
    maxFiles = 1,
    maxBytes,
    maxDimensions,
    disabled = false,
    transformFile,
}: UseImageSelectionOptions) {
    const inputRef = useRef<HTMLInputElement>(null);
    const previewUrls = useRef(new Map<string, string>());
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectionError, setSelectionError] = useState<string | null>(null);

    // this memo reads and mutates previewUrls.current during render on purpose. caching blob urls
    // by file identity is what stops previews flickering on every keystroke in the parent form.
    // react compiler flags ref access during render as a syntactic rule and cannot see that
    // create-if-missing is idempotent. moving revocation into an effect was tried and brought the
    // flicker back, so it stays here. do not "fix" this :]
    const items = useMemo<ImageSelectionItem[]>(() => {
        const currentKeys = new Set(files.map(getFileKey));

        // eslint-disable-next-line react-hooks/refs - -see comment above, revocation must stay in this memo
        previewUrls.current.forEach((url, key) => {
            if (!currentKeys.has(key)) {
                URL.revokeObjectURL(url);
                previewUrls.current.delete(key);
            }
        });

        // eslint-disable-next-line react-hooks/refs -- see comment above, cache lookup must stay in this memo
        return files.map((file) => {
            const key = getFileKey(file);
            let previewUrl = previewUrls.current.get(key);

            if (!previewUrl) {
                previewUrl = URL.createObjectURL(file);
                previewUrls.current.set(key, previewUrl);
            }

            return { file, previewUrl };
        });
    }, [files]);

    useEffect(() => {
        const urls = previewUrls.current;

        return () => {
            urls.forEach((url) => URL.revokeObjectURL(url));
            urls.clear();
        };
    }, []);

    const remove = useCallback(
        // eslint-disable-next-line react-hooks/preserve-manual-memoization -- compiler inference is unreliable while the memo above bails out
        (index: number) => {
            setSelectionError(null);
            onFilesChange(files.filter((_, fileIndex) => fileIndex !== index));
        },
        [files, onFilesChange],
    );

    // eslint-disable-next-line react-hooks/preserve-manual-memoization -- compiler inference is unreliable while the memo above bails out
    const clear = useCallback(() => {
        setSelectionError(null);
        onFilesChange([]);
    }, [onFilesChange]);

    const selectFiles = useCallback(
        async (selectedFiles: File[]) => {
            if (selectedFiles.length === 0 || disabled || isProcessing) {
                return;
            }

            const replaceSelection = maxFiles === 1;
            const remainingSlots = replaceSelection
                ? 1
                : maxFiles - files.length;

            if (remainingSlots <= 0) {
                return;
            }

            const candidates = selectedFiles.slice(0, remainingSlots);
            const errors: string[] = [];

            if (candidates.length < selectedFiles.length) {
                errors.push(`Maksimal ${maxFiles} foto dapat dipilih.`);
            }

            setIsProcessing(true);

            try {
                const accepted: File[] = [];

                for (const selectedFile of candidates) {
                    if (!imageMimeTypes.has(selectedFile.type)) {
                        errors.push(
                            `${selectedFile.name} bukan JPEG, PNG, atau WebP.`,
                        );
                        continue;
                    }

                    try {
                        const file = transformFile
                            ? await transformFile(selectedFile)
                            : selectedFile;

                        if (maxBytes !== undefined && file.size > maxBytes) {
                            errors.push(`${file.name} melebihi batas ukuran.`);
                            continue;
                        }

                        if (maxDimensions !== undefined) {
                            const dimensions = await readImageDimensions(file);

                            if (
                                dimensions.width > maxDimensions.width ||
                                dimensions.height > maxDimensions.height
                            ) {
                                errors.push(
                                    `${file.name} melebihi batas dimensi.`,
                                );
                                continue;
                            }
                        }

                        accepted.push(file);
                    } catch {
                        errors.push(
                            `Gagal mengoptimalkan ${selectedFile.name}.`,
                        );
                    }
                }

                if (accepted.length > 0) {
                    onFilesChange(
                        replaceSelection ? accepted : [...files, ...accepted],
                    );
                }

                setSelectionError(errors[0] ?? null);
            } finally {
                setIsProcessing(false);
            }
        },
        [
            disabled,
            files,
            isProcessing,
            maxBytes,
            maxDimensions,
            maxFiles,
            onFilesChange,
            transformFile,
        ],
    );

    const handleFileChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            const selectedFiles = Array.from(event.currentTarget.files ?? []);
            event.currentTarget.value = '';

            void selectFiles(selectedFiles);
        },
        [selectFiles],
    );

    const isFull = maxFiles > 1 && files.length >= maxFiles;

    return {
        inputRef: inputRef as RefObject<HTMLInputElement | null>,
        items,
        isDisabled: disabled || isProcessing || isFull,
        isProcessing,
        isFull,
        selectionError,
        clear,
        remove,
        handleFileChange,
    };
}
