<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SessionModelResource;
use App\Models\SessionModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

final class SessionModelController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        return SessionModelResource::collection(
            $request->user()
                ->sessionModels()
                ->with(['sessionExercises.exercise'])
                ->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'                      => ['required', 'string', 'max:255'],
            'exercises'                 => ['required', 'array', 'min:1'],
            'exercises.*.exercise_id'   => ['required', 'integer', 'exists:exercises,id'],
            'exercises.*.sets_count'    => ['required', 'integer', 'min:1'],
            'exercises.*.goal_type'     => ['required', 'string', 'in:fixed,max'],
            'exercises.*.goal_value'    => ['nullable', 'integer', 'min:1'],
            'exercises.*.rest_time'     => ['required', 'integer', 'min:0'],
            'exercises.*.order'         => ['required', 'integer', 'min:0'],
        ]);

        $model = $request->user()->sessionModels()->create(['name' => $data['name']]);
        $model->sessionExercises()->createMany($data['exercises']);
        $model->load('sessionExercises.exercise');

        return (new SessionModelResource($model))->response()->setStatusCode(201);
    }

    public function show(Request $request, SessionModel $model): SessionModelResource
    {
        abort_if($model->user_id !== $request->user()->id, 403);
        $model->load('sessionExercises.exercise');

        return new SessionModelResource($model);
    }

    public function update(Request $request, SessionModel $model): SessionModelResource
    {
        abort_if($model->user_id !== $request->user()->id, 403);

        $data = $request->validate([
            'name'                      => ['sometimes', 'string', 'max:255'],
            'exercises'                 => ['sometimes', 'array', 'min:1'],
            'exercises.*.exercise_id'   => ['required_with:exercises', 'integer', 'exists:exercises,id'],
            'exercises.*.sets_count'    => ['required_with:exercises', 'integer', 'min:1'],
            'exercises.*.goal_type'     => ['required_with:exercises', 'string', 'in:fixed,max'],
            'exercises.*.goal_value'    => ['nullable', 'integer', 'min:1'],
            'exercises.*.rest_time'     => ['required_with:exercises', 'integer', 'min:0'],
            'exercises.*.order'         => ['required_with:exercises', 'integer', 'min:0'],
        ]);

        if (isset($data['name'])) {
            $model->update(['name' => $data['name']]);
        }

        if (isset($data['exercises'])) {
            $model->sessionExercises()->delete();
            $model->sessionExercises()->createMany($data['exercises']);
        }

        $model->load('sessionExercises.exercise');

        return new SessionModelResource($model);
    }

    public function destroy(Request $request, SessionModel $model): \Illuminate\Http\Response
    {
        abort_if($model->user_id !== $request->user()->id, 403);
        $model->delete();

        return response()->noContent();
    }
}
