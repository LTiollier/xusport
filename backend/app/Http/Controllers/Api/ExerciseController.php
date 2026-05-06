<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ExerciseResource;
use App\Models\Exercise;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

final class ExerciseController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return ExerciseResource::collection(Exercise::all());
    }

    public function store(\Illuminate\Http\Request $request): ExerciseResource
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'group' => 'nullable|string|max:255',
            'icon' => 'nullable|string|max:255',
        ]);

        return new ExerciseResource(Exercise::create($validated));
    }

    public function update(\Illuminate\Http\Request $request, Exercise $exercise): ExerciseResource
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'group' => 'nullable|string|max:255',
            'icon' => 'nullable|string|max:255',
        ]);

        $exercise->update($validated);

        return new ExerciseResource($exercise);
    }

    public function destroy(Exercise $exercise): \Illuminate\Http\Response
    {
        $exercise->delete();

        return response()->noContent();
    }

    public function show(Exercise $exercise): ExerciseResource
    {
        return new ExerciseResource($exercise);
    }
}
