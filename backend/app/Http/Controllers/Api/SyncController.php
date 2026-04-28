<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ExerciseResource;
use App\Http\Resources\SessionLogResource;
use App\Http\Resources\SessionModelResource;
use App\Models\Exercise;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class SyncController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        return response()->json([
            'exercises' => ExerciseResource::collection(Exercise::all()),
            'models'    => SessionModelResource::collection(
                $request->user()
                    ->sessionModels()
                    ->with(['sessionExercises.exercise'])
                    ->get()
            ),
            'history' => SessionLogResource::collection(
                $request->user()
                    ->sessionLogs()
                    ->with('performanceLogs')
                    ->orderByDesc('completed_at')
                    ->get()
            ),
        ]);
    }
}
