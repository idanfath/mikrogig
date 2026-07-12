<?php

use App\Services\CompressionService;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;

it('compresses image content and reduces size when converting to jpg', function () {
    $width = 800;
    $height = 600;

    $im = imagecreatetruecolor($width, $height);
    $bg = imagecolorallocate($im, 255, 0, 0);
    imagefill($im, 0, 0, $bg);

    ob_start();
    imagepng($im);
    $png = ob_get_clean();
    imagedestroy($im);

    expect(strlen($png))->toBeGreaterThan(0);

    $service = new CompressionService;
    $compressed = $service->compress($png, 'jpg', ['quality' => 60, 'maxWidth' => 400]);

    expect(is_string($compressed))->toBeTrue();
    expect(strlen($compressed))->toBeGreaterThan(0);

    // Decode compressed bytes and assert dimensions and media type
    $manager = new ImageManager(Driver::class);
    $decoded = $manager->decodeBinary($compressed);
    expect($decoded->width())->toBeLessThanOrEqual(400);
    expect($decoded->origin()->mediaType())->toBe('image/jpeg');
});
