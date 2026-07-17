<?php

namespace App\Http\Controllers;

use App\RegionCatalog;
use Illuminate\Http\JsonResponse;

class RegionController extends Controller
{
    public function __construct(private RegionCatalog $regions) {}

    public function provinces(): JsonResponse
    {
        return response()->json($this->regions->provinces());
    }

    public function regencies(string $province): JsonResponse
    {
        $regencies = $this->regions->regencies($province);

        abort_if($regencies === null, 404);

        return response()->json($regencies);
    }
}
