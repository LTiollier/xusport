<?php

use App\Models\Exercise;
use App\Models\PerformanceLog;
use App\Models\SessionLog;
use App\Models\SessionModel;
use App\Models\User;

it('lists own session logs', function (): void {
    $user  = User::factory()->create();
    $other = User::factory()->create();
    SessionLog::factory()->for($user)->count(2)->create();
    SessionLog::factory()->for($other)->create();

    $this->actingAs($user)
        ->getJson('/api/session-logs')
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

it('creates a session log and computes is_pb', function (): void {
    $user     = User::factory()->create();
    $model    = SessionModel::factory()->for($user)->create();
    $exercise = Exercise::factory()->create();

    $this->actingAs($user)->postJson('/api/session-logs', [
        'session_model_id' => $model->id,
        'completed_at'     => '2026-04-27T10:00:00Z',
        'performance_logs' => [
            ['exercise_id' => $exercise->id, 'set_number' => 1, 'reps_done' => 12],
            ['exercise_id' => $exercise->id, 'set_number' => 2, 'reps_done' => 10],
        ],
    ])->assertCreated()
        ->assertJsonPath('data.performance_logs.0.is_pb', true)
        ->assertJsonPath('data.performance_logs.1.is_pb', true)
        ->assertJsonPath('data.has_pb', true);
});

it('marks is_pb true only when reps exceed previous best', function (): void {
    $user     = User::factory()->create();
    $model    = SessionModel::factory()->for($user)->create();
    $exercise = Exercise::factory()->create();

    // Previous best: 15 reps
    $oldLog = SessionLog::factory()->for($user)->for($model, 'sessionModel')->create();
    PerformanceLog::factory()->for($oldLog, 'sessionLog')->create([
        'exercise_id' => $exercise->id,
        'set_number'  => 1,
        'reps_done'   => 15,
        'is_pb'       => true,
    ]);

    $this->actingAs($user)->postJson('/api/session-logs', [
        'session_model_id' => $model->id,
        'completed_at'     => now()->toIso8601String(),
        'performance_logs' => [
            ['exercise_id' => $exercise->id, 'set_number' => 1, 'reps_done' => 10],
            ['exercise_id' => $exercise->id, 'set_number' => 2, 'reps_done' => 16],
        ],
    ])->assertCreated()
        ->assertJsonPath('data.performance_logs.0.is_pb', false)
        ->assertJsonPath('data.performance_logs.1.is_pb', true);
});

it('returns a session log', function (): void {
    $user = User::factory()->create();
    $log  = SessionLog::factory()->for($user)->create();

    $this->actingAs($user)
        ->getJson("/api/session-logs/{$log->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $log->id);
});

it('forbids viewing another user session log', function (): void {
    $user  = User::factory()->create();
    $other = User::factory()->create();
    $log   = SessionLog::factory()->for($other)->create();

    $this->actingAs($user)
        ->getJson("/api/session-logs/{$log->id}")
        ->assertForbidden();
});

it('updates synced_at', function (): void {
    $user = User::factory()->create();
    $log  = SessionLog::factory()->for($user)->create(['synced_at' => null]);

    $this->actingAs($user)->putJson("/api/session-logs/{$log->id}", [
        'synced_at' => '2026-04-27T12:00:00Z',
    ])->assertOk()->assertJsonPath('data.synced_at', '2026-04-27T12:00:00+00:00');
});

it('deletes a session log', function (): void {
    $user = User::factory()->create();
    $log  = SessionLog::factory()->for($user)->create();

    $this->actingAs($user)
        ->deleteJson("/api/session-logs/{$log->id}")
        ->assertNoContent();

    expect(SessionLog::find($log->id))->toBeNull();
});
