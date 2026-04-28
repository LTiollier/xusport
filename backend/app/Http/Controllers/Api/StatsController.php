<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PerformanceLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final class StatsController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();

        // Streak (Basic implementation: consecutive days with sessions)
        $streak = $this->calculateStreak($user->id);

        // PB count
        $pbCount = PerformanceLog::whereHas('sessionLog', fn($q) => $q->where('user_id', $user->id))
            ->where('is_pb', true)
            ->count();

        // Weekly count
        $weeklyCount = $user->sessionLogs()
            ->where('completed_at', '>=', now()->startOfWeek())
            ->count();

        // Last model
        $lastLog = $user->sessionLogs()
            ->with('sessionModel')
            ->orderByDesc('completed_at')
            ->first();

        return response()->json([
            'streak'       => $streak,
            'pb_count'     => $pbCount,
            'weekly_count' => $weeklyCount,
            'last_model'   => $lastLog?->sessionModel,
        ]);
    }

    public function progression(Request $request, \App\Models\Exercise $exercise): JsonResponse
    {
        $user = $request->user();

        $progression = PerformanceLog::query()
            ->join('session_logs', 'performance_logs.session_log_id', '=', 'session_logs.id')
            ->where('session_logs.user_id', $user->id)
            ->where('performance_logs.exercise_id', $exercise->id)
            ->select(
                DB::raw('DATE(session_logs.completed_at) as date'),
                DB::raw('MAX(performance_logs.reps_done) as max_reps')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json($progression);
    }

    private function calculateStreak(int $userId): int
    {
        $dates = DB::table('session_logs')
            ->where('user_id', $userId)
            ->selectRaw('DATE(completed_at) as date')
            ->distinct()
            ->orderByDesc('date')
            ->pluck('date');

        if ($dates->isEmpty()) {
            return 0;
        }

        $streak = 0;
        $currentDate = now()->startOfDay();
        
        // If no session today, check if there was one yesterday to keep the streak alive
        if ($dates[0] !== $currentDate->format('Y-m-d')) {
            $currentDate->subDay();
            if ($dates[0] !== $currentDate->format('Y-m-d')) {
                return 0;
            }
        }

        foreach ($dates as $date) {
            if ($date === $currentDate->format('Y-m-d')) {
                $streak++;
                $currentDate->subDay();
            } else {
                break;
            }
        }

        return $streak;
    }
}
