<?php

namespace App\Services;

use DomainException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

final class GigDisputeEvidenceService
{
    public function __construct(private ImageCompressionService $compression) {}

    /** @param array<int, UploadedFile> $photos @return list<string> */
    public function store(array $photos): array
    {
        $this->validate($photos);
        $paths = [];
        try {
            foreach ($photos as $photo) {
                $content = file_get_contents($photo->getRealPath());
                if ($content === false || $content === '') {
                    throw new RuntimeException('Failed to read dispute evidence.');
                }
                $format = match ($photo->getMimeType()) {
                    'image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', default => throw new RuntimeException('Unsupported dispute evidence format.')
                };
                $path = 'disputes/'.Str::uuid().'.'.$format;
                if (! Storage::disk('local')->put($path, $this->compression->compress($content, $format, ['quality' => 80, 'maxWidth' => 1920, 'maxHeight' => 1920]))) {
                    throw new RuntimeException('Failed to store dispute evidence.');
                }
                $paths[] = $path;
            }

            return $paths;
        } catch (\Throwable $exception) {
            foreach ($paths as $path) {
                Storage::disk('local')->delete($path);
            }
            throw $exception;
        }
    }

    /** @param array<int, UploadedFile> $photos */
    private function validate(array $photos): void
    {
        if (count($photos) < 1 || count($photos) > 5) {
            throw new DomainException('Dispute evidence requires between one and five photos.');
        }

        foreach ($photos as $photo) {
            if (! $photo instanceof UploadedFile || ! $photo->isValid()) {
                throw new DomainException('Dispute evidence upload is invalid.');
            }

            $extension = strtolower($photo->getClientOriginalExtension());
            if (! in_array($extension, ['jpg', 'jpeg', 'png', 'webp'], true) || ! in_array($photo->getMimeType(), ['image/jpeg', 'image/png', 'image/webp'], true)) {
                throw new DomainException('Dispute evidence must be a JPEG, PNG, or WebP image.');
            }

            if ($photo->getSize() > 5 * 1024 * 1024) {
                throw new DomainException('Dispute evidence may not exceed 5 MB.');
            }

            $dimensions = getimagesize($photo->getRealPath());
            if ($dimensions === false || $dimensions[0] > 12_000 || $dimensions[1] > 12_000) {
                throw new DomainException('Dispute evidence dimensions are invalid.');
            }
        }
    }

    /** @param list<string> $paths */
    public function delete(array $paths): void
    {
        foreach ($paths as $path) {
            Storage::disk('local')->delete($path);
        }
    }
}
