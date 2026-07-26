<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;

final class GigWorkflowEvidenceService
{
    public function __construct(private GigPrivateImageService $images) {}

    /**
     * @param  array<int, UploadedFile>  $photos
     * @return list<string>
     */
    public function store(array $photos, int $minimum = 1): array
    {
        return array_column($this->images->store(
            $photos,
            'gig-workflow',
            'Gig workflow evidence',
            $minimum,
        ), 'path');
    }

    /** @param list<string> $paths */
    public function delete(array $paths): void
    {
        $this->images->delete($paths);
    }
}
