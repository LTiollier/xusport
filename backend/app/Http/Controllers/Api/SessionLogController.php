<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SessionLogResource;
use App\Models\PerformanceLog;
use App\Models\SessionLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

final class SessionLogController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        return SessionLogResource::collection(
            $request->user()
                ->sessionLogs()
                ->with('performanceLogs')
                ->orderByDesc('completed_at')
                ->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'session_model_id'                => ['required', 'integer', 'exists:session_models,id'],
            'duration'                        => ['nullable', 'integer', 'min:0'],
            'completed_at'                    => ['required', 'date'],
            'synced_at'                       => ['nullable', 'date'],
            'performance_logs'                => ['required', 'array', 'min:1'],
            'performance_logs.*.exercise_id'  => ['required', 'integer', 'exists:exercises,id'],
            'performance_logs.*.set_number'   => ['required', 'integer', 'min:1'],
            'performance_logs.*.reps_done'    => ['required', 'integer', 'min:0'],
        ]);

        $request->user()->sessionModels()->findOrFail($data['session_model_id']);

        $pbMap = $this->computePbMap($request->user()->id, $data['performance_logs']);

        $sessionLog = $request->user()->sessionLogs()->create([
            'session_model_id' => $data['session_model_id'],
            'duration'         => $data['duration'] ?? null,
            'completed_at'     => $data['completed_at'],
            'synced_at'        => $data['synced_at'] ?? now(),
        ]);

        $sessionLog->performanceLogs()->createMany(
            array_map(
                fn(array $log): array => [
                    ...$log,
                    'is_pb' => $log['reps_done'] > ($pbMap[$log['exercise_id']] ?? 0),
                ],
                $data['performance_logs']
            )
        );

        $sessionLog->load('performanceLogs');

        return (new SessionLogResource($sessionLog))->response()->setStatusCode(201);
    }

    public function show(Request $request, SessionLog $history): SessionLogResource
    {
        abort_if($history->user_id !== $request->user()->id, 403);
        $history->load('performanceLogs');

        return new SessionLogResource($history);
    }

    public function update(Request $request, SessionLog $history): SessionLogResource
    {
        abort_if($history->user_id !== $request->user()->id, 403);

        $data = $request->validate([
            'completed_at' => ['sometimes', 'date'],
            'synced_at'    => ['nullable', 'date'],
        ]);

        $history->update($data);
        $history->load('performanceLogs');

        return new SessionLogResource($history);
    }

    public function destroy(Request $request, SessionLog $history): \Illuminate\Http\Response
    {
        abort_if($history->user_id !== $request->user()->id, 403);
        $history->delete();

        return response()->noContent();
    }

    /** @param array<int, array{exercise_id: int, reps_done: int}> $perfLogs */
    private function computePbMap(int $userId, array $perfLogs): array
    {
        $exerciseIds = array_unique(array_column($perfLogs, 'exercise_id'));

        return PerformanceLog::query()
            ->join('session_logs', 'performance_logs.session_log_id', '=', 'session_logs.id')
            ->where('session_logs.user_id', $userId)
            ->whereIn('performance_logs.exercise_id', $exerciseIds)
            ->groupBy('performance_logs.exercise_id')
            ->selectRaw('performance_logs.exercise_id, MAX(reps_done) as max_reps')
            ->pluck('max_reps', 'exercise_id')
            ->toArray();
    }
}
