<?php

use App\Models\Exercise;
use App\Models\SessionModel;
use App\Models\User;

it('lists own session models', function (): void {
    $user  = User::factory()->create();
    $other = User::factory()->create();
    SessionModel::factory()->for($user)->count(2)->create();
    SessionModel::factory()->for($other)->create();

    $this->actingAs($user)
        ->getJson('/api/session-models')
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

it('creates a session model with exercises', function (): void {
    $user     = User::factory()->create();
    $exercise = Exercise::factory()->create();

    $this->actingAs($user)->postJson('/api/session-models', [
        'name'      => 'Push Day',
        'exercises' => [
            [
                'exercise_id' => $exercise->id,
                'sets_count'  => 3,
                'goal_type'   => 'fixed',
                'goal_value'  => 10,
                'rest_time'   => 60,
                'order'       => 0,
            ],
        ],
    ])->assertCreated()
        ->assertJsonPath('data.name', 'Push Day')
        ->assertJsonCount(1, 'data.exercises');
});

it('returns a session model', function (): void {
    $user  = User::factory()->create();
    $model = SessionModel::factory()->for($user)->create();

    $this->actingAs($user)
        ->getJson("/api/session-models/{$model->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $model->id);
});

it('forbids viewing another user session model', function (): void {
    $user  = User::factory()->create();
    $other = User::factory()->create();
    $model = SessionModel::factory()->for($other)->create();

    $this->actingAs($user)
        ->getJson("/api/session-models/{$model->id}")
        ->assertForbidden();
});

it('updates a session model name', function (): void {
    $user  = User::factory()->create();
    $model = SessionModel::factory()->for($user)->create(['name' => 'Old Name']);

    $this->actingAs($user)->putJson("/api/session-models/{$model->id}", [
        'name' => 'New Name',
    ])->assertOk()->assertJsonPath('data.name', 'New Name');
});

it('replaces exercises on update', function (): void {
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

    $newExercise = Exercise::factory()->create();

    $this->actingAs($user)->putJson("/api/session-models/{$model->id}", [
        'exercises' => [
            [
                'exercise_id' => $newExercise->id,
                'sets_count'  => 4,
                'goal_type'   => 'max',
                'goal_value'  => null,
                'rest_time'   => 90,
                'order'       => 0,
            ],
        ],
    ])->assertOk()->assertJsonCount(1, 'data.exercises')
        ->assertJsonPath('data.exercises.0.exercise_id', $newExercise->id);
});

it('deletes a session model', function (): void {
    $user  = User::factory()->create();
    $model = SessionModel::factory()->for($user)->create();

    $this->actingAs($user)
        ->deleteJson("/api/session-models/{$model->id}")
        ->assertNoContent();

    expect(SessionModel::find($model->id))->toBeNull();
});
