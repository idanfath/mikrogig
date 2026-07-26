<?php

namespace App\Services;

use DomainException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class GigPrivateImageService
{
    public function __construct(private ImageCompressionService $compression) {}

    /**
     * @param  array<int, UploadedFile>  $images
     * @return list<array{path: string, mime_type: string}>
     */
    public function store(
        array $images,
        string $directory,
        string $label,
        int $minimum = 0,
    ): array {
        $this->validate($images, $label, $minimum);
        $stored = [];

        try {
            foreach ($images as $image) {
                $content = file_get_contents($image->getRealPath());
                if ($content === false || $content === '') {
                    throw new RuntimeException("Failed to read {$label}.");
                }

                $mimeType = $image->getMimeType();
                $format = match ($mimeType) {
                    'image/jpeg' => 'jpg',
                    'image/png' => 'png',
                    'image/webp' => 'webp',
                    default => throw new RuntimeException("Unsupported {$label} format."),
                };
                $path = trim($directory, '/').'/'.Str::uuid().'.'.$format;
                $compressed = $this->compression->compress($content, $format, [
                    'quality' => 80,
                    'maxWidth' => 1920,
                    'maxHeight' => 1920,
                ]);

                if (! Storage::disk('local')->put($path, $compressed)) {
                    throw new RuntimeException("Failed to store {$label}.");
                }

                $stored[] = ['path' => $path, 'mime_type' => $mimeType];
            }

            return $stored;
        } catch (Throwable $exception) {
            $this->delete(array_column($stored, 'path'));

            throw $exception;
        }
    }

    /** @param list<string> $paths */
    public function delete(array $paths): void
    {
        foreach ($paths as $path) {
            Storage::disk('local')->delete($path);
        }
    }

    /** @param array<int, UploadedFile> $images */
    private function validate(array $images, string $label, int $minimum): void
    {
        if (count($images) < $minimum || count($images) > 5) {
            throw new DomainException("{$label} requires between {$minimum} and five photos.");
        }

        foreach ($images as $image) {
            if (! $image instanceof UploadedFile || ! $image->isValid()) {
                throw new DomainException("{$label} upload is invalid.");
            }

            $extension = Str::lower($image->getClientOriginalExtension());
            if (! in_array($extension, ['jpg', 'jpeg', 'png', 'webp'], true)
                || ! in_array($image->getMimeType(), ['image/jpeg', 'image/png', 'image/webp'], true)) {
                throw new DomainException("{$label} must be a JPEG, PNG, or WebP image.");
            }

            if ($image->getSize() > 5 * 1024 * 1024) {
                throw new DomainException("{$label} may not exceed 5 MB.");
            }

            $dimensions = getimagesize($image->getRealPath());
            if ($dimensions === false || $dimensions[0] > 12_000 || $dimensions[1] > 12_000) {
                throw new DomainException("{$label} dimensions are invalid.");
            }
        }
    }
}
