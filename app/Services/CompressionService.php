<?php

namespace App\Services;

use Intervention\Image\Drivers\Imagick\Driver;
use Intervention\Image\ImageManager;
use RuntimeException;

class CompressionService
{
    /**
     * Create a new class instance.
     */
    private ImageManager $manager;

    public function __construct(?ImageManager $manager = null)
    {
        $this->manager = $manager ?? new ImageManager(
            extension_loaded('imagick')
              ? Driver::class
              : \Intervention\Image\Drivers\Gd\Driver::class
        );
    }

    /**
     * Compress image content and return encoded binary string.
     *
     * @param  string  $content  Raw image bytes
     * @param  string|null  $format  Desired format (jpg|png|webp). If null, keep original format.
     * @param  array  $options  ['quality' => int(0-100), 'maxWidth' => int|null, 'maxHeight' => int|null]
     * @return string Encoded image bytes
     *
     * @throws \InvalidArgumentException|RuntimeException
     */
    public function compress(string $content, ?string $format = null, array $options = []): string
    {
        if ($content === '') {
            throw new \InvalidArgumentException('Empty image content provided.');
        }

        try {
            $image = $this->manager->decodeBinary($content);
        } catch (\Exception $e) {
            throw new RuntimeException('Failed to create image from content: '.$e->getMessage(), 0, $e);
        }

        $detected = $this->formatFromMime($image->origin()->mediaType());
        $targetFormat = $this->normalizeFormat($format ?? $detected);

        if (! in_array($targetFormat, ['jpg', 'jpeg', 'png', 'webp'], true)) {
            throw new \InvalidArgumentException('Unsupported image format: '.$targetFormat);
        }

        $maxW = isset($options['maxWidth']) ? (int) $options['maxWidth'] : null;
        $maxH = isset($options['maxHeight']) ? (int) $options['maxHeight'] : null;
        if ($maxW || $maxH) {
            $image->resize($maxW, $maxH);
            // keep aspect ratio and avoid upscaling
            $image->scaleDown($maxW, $maxH);
        }

        $quality = isset($options['quality']) ? (int) $options['quality'] : 80;

        try {
            switch ($targetFormat) {
                case 'jpg':
                case 'jpeg':
                    $encoded = $image->encodeUsingFileExtension('jpg', $quality);
                    break;
                case 'webp':
                    $encoded = $image->encodeUsingFileExtension('webp', $quality);
                    break;
                case 'png':
                    // PNG encoders do not accept quality the same way JPEG/WebP do.
                    $encoded = $image->encodeUsingFileExtension('png');
                    break;
                default:
                    throw new \InvalidArgumentException('Unsupported image format: '.$targetFormat);
            }

            return (string) $encoded;
        } catch (\Exception $e) {
            throw new RuntimeException('Failed to encode image: '.$e->getMessage(), 0, $e);
        }
    }

    /**
     * Return preset compression defaults.
     */
    public function getCompressionDefaults(string $type = 'standard'): array
    {
        switch ($type) {
            case 'highQuality':
                return ['quality' => 90];
            case 'aggressive':
                return ['quality' => 70];
            default:
                return ['quality' => 80];
        }
    }

    private function formatFromMime(string $mime): string
    {
        $map = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
        ];

        return $map[$mime] ?? 'jpg';
    }

    private function normalizeFormat(string $format): string
    {
        $f = strtolower(trim($format));
        if ($f === 'jpeg') {
            return 'jpg';
        }

        return $f;
    }
}
