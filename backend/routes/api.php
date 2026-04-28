<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ExerciseController;
use App\Http\Controllers\Api\SessionLogController;
use App\Http\Controllers\Api\SessionModelController;
use App\Http\Controllers\Api\StatsController;
use App\Http\Controllers\Api\SyncController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);

    Route::get('/sync', SyncController::class);

    // 1. Exercices
    Route::get('/exercises', [ExerciseController::class, 'index']);

    // 2. Séances (Workout Models)
    Route::apiResource('models', SessionModelController::class);

    // 3. Historique & Logs
    Route::get('/history', [SessionLogController::class, 'index']);
    Route::post('/history', [SessionLogController::class, 'store']);
    Route::get('/history/{history}', [SessionLogController::class, 'show']);
    Route::put('/history/{history}', [SessionLogController::class, 'update']);
    Route::delete('/history/{history}', [SessionLogController::class, 'destroy']);

    // 4. Statistiques
    Route::get('/stats/dashboard', [StatsController::class, 'dashboard']);
    Route::get('/stats/progression/{exercise}', [StatsController::class, 'progression']);

    // 5. Profil & Paramètres
    Route::get('/user/profile', [UserController::class, 'profile']);
    Route::put('/user/settings', [UserController::class, 'updateSettings']);
});
