<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class UserController extends Controller
{
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $totalReps = $user->sessionLogs()
            ->join('performance_logs', 'session_logs.id', '=', 'performance_logs.session_log_id')
            ->sum('reps_done');
            
        $totalSessions = $user->sessionLogs()->count();

        return response()->json([
            'id'             => $user->id,
            'name'           => $user->name,
            'email'          => $user->email,
            'total_reps'     => $totalReps,
            'total_sessions' => $totalSessions,
            'settings'       => $user->settings ?? [
                'sound'     => true,
                'vibrate'   => true,
                'demo_mode' => false,
            ],
        ]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $data = $request->validate([
            'sound'     => ['required', 'boolean'],
            'vibrate'   => ['required', 'boolean'],
            'demo_mode' => ['required', 'boolean'],
        ]);

        $user = $request->user();
        $user->update(['settings' => $data]);

        return response()->json(['settings' => $user->settings]);
    }
}
