<?php

use App\Models\Exercise;
use App\Models\SessionLog;
use App\Models\SessionModel;
use App\Models\User;

it('returns all user data in one request', function (): void {
    $user     = User::factory()->create();
    $exercise = Exercise::factory()->create();
    $model    = SessionModel::factory()->for($user)->create();
    $model->sessionExercises()->create([
        'exercise_id' => $exercise->id,
        'sets_count'  => 3,
        'goal_type'   => 'fixed',
        'goal_value'  => 10,
        'rest_time'   => 60,
        'order'       => 0,
    ]);
    SessionLog::factory()->for($user)->for($model, 'sessionModel')->create();

    $this->actingAs($user)->getJson('/api/sync')
        ->assertOk()
        ->assertJsonStructure(['exercises', 'session_models', 'session_logs'])
        ->assertJsonCount(1, 'exercises')
        ->assertJsonCount(1, 'session_models')
        ->assertJsonCount(1, 'session_logs');
});

it('only returns data belonging to the authenticated user', function (): void {
    $user  = User::factory()->create();
    $other = User::factory()->create();
    SessionModel::factory()->for($other)->create();
    SessionLog::factory()->for($other)->create();

    $this->actingAs($user)->getJson('/api/sync')
        ->assertOk()
        ->assertJsonCount(0, 'session_models')
        ->assertJsonCount(0, 'session_logs');
});
