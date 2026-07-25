<?php

namespace App\Actions;

use App\Enums\GigStatus;
use App\Enums\UserRole;
use App\Models\Gig;
use App\Models\User;
use App\RegionCatalog;
use App\Services\ImageCompressionService;
use DomainException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

final class CreateGig
{
    public function __construct(
        private RegionCatalog $regions,
        private ImageCompressionService $imageCompression,
    ) {}

    /**
     * @param  array<string, mixed>  $attributes
     * @param  array<int, UploadedFile>  $photos
     */
    public function execute(User $client, array $attributes, array $photos): Gig
    {
        if ($client->role !== UserRole::Client) {
            throw new DomainException('Only clients may create gigs.');
        }

        $province = $this->regions->province($attributes['province_id']);
        $regency = $this->regions->regency($attributes['province_id'], $attributes['regency_id']);

        if ($province === null || $regency === null) {
            throw new DomainException('Selected region is invalid.');
        }

        $disk = Storage::disk('cos');
        $paths = [];

        try {
            foreach ($photos as $photo) {
                $content = file_get_contents($photo->getRealPath());

                if ($content === false || $content === '') {
                    throw new RuntimeException('Failed to read uploaded gig photo.');
                }

                $format = match ($photo->getMimeType()) {
                    'image/jpeg' => 'jpg',
                    'image/png' => 'png',
                    'image/webp' => 'webp',
                    default => throw new RuntimeException('Unsupported gig photo format.'),
                };
                $path = 'gigs/'.Str::uuid().'.'.$format;
                $compressed = $this->imageCompression->compress($content, $format, [
                    'quality' => 80,
                    'maxWidth' => 1920,
                    'maxHeight' => 1920,
                ]);
                $paths[] = $path;

                if (! $disk->put($path, $compressed, 'public')) {
                    throw new RuntimeException('Failed to store gig photo.');
                }
            }

            return DB::transaction(function () use ($attributes, $client, $paths, $province, $regency): Gig {
                $gig = new Gig;
                $gig->client()->associate($client);
                $gig->fill([
                    ...$attributes,
                    'province_name' => $province['name'],
                    'regency_name' => $regency['name'],
                ]);
                $gig->status = GigStatus::Open;
                $gig->save();

                foreach ($paths as $path) {
                    $gig->media()->create(['path' => $path]);
                }

                return $gig->load('media');
            });
        } catch (Throwable $exception) {
            foreach ($paths as $path) {
                try {
                    $disk->delete($path);
                } catch (Throwable $cleanupException) {
                    report($cleanupException);
                }
            }

            throw $exception;
        }
    }
}
