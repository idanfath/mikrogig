<?php

namespace App\Services;

use DomainException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

final class GigWorkflowEvidenceService
{
    public function __construct(private ImageCompressionService $compression) {}

    /**
     * @param  array<int, UploadedFile>  $photos
     * @return list<string>
     */
    public function store(array $photos, int $minimum = 1): array
    {
        $this->validate($photos, $minimum);
        $paths = [];

        try {
            foreach ($photos as $photo) {
                $content = file_get_contents($photo->getRealPath());
                if ($content === false || $content === '') {
                    throw new RuntimeException('Failed to read gig workflow evidence.');
                }

                $format = match ($photo->getMimeType()) {
                    'image/jpeg' => 'jpg',
                    'image/png' => 'png',
                    'image/webp' => 'webp',
                    default => throw new RuntimeException('Unsupported gig workflow evidence format.'),
                };
                $path = 'gig-workflow/'.Str::uuid().'.'.$format;
                $compressed = $this->compression->compress($content, $format, [
                    'quality' => 80,
                    'maxWidth' => 1920,
                    'maxHeight' => 1920,
                ]);

                if (! Storage::disk('local')->put($path, $compressed)) {
                    throw new RuntimeException('Failed to store gig workflow evidence.');
                }

                $paths[] = $path;
            }

            return $paths;
        } catch (Throwable $exception) {
            $this->delete($paths);

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

    /** @param array<int, UploadedFile> $photos */
    private function validate(array $photos, int $minimum): void
    {
        if (count($photos) < $minimum || count($photos) > 5) {
            throw new DomainException("Gig workflow evidence requires between {$minimum} and five photos.");
        }

        foreach ($photos as $photo) {
            if (! $photo instanceof UploadedFile || ! $photo->isValid()) {
                throw new DomainException('Gig workflow evidence upload is invalid.');
            }

            $extension = Str::lower($photo->getClientOriginalExtension());
            if (! in_array($extension, ['jpg', 'jpeg', 'png', 'webp'], true)
                || ! in_array($photo->getMimeType(), ['image/jpeg', 'image/png', 'image/webp'], true)) {
                throw new DomainException('Gig workflow evidence must be a JPEG, PNG, or WebP image.');
            }

            if ($photo->getSize() > 5 * 1024 * 1024) {
                throw new DomainException('Gig workflow evidence may not exceed 5 MB.');
            }

            $dimensions = getimagesize($photo->getRealPath());
            if ($dimensions === false || $dimensions[0] > 12_000 || $dimensions[1] > 12_000) {
                throw new DomainException('Gig workflow evidence dimensions are invalid.');
            }
        }
    }
}
