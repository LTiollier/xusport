<?php

use App\Models\Exercise;
use App\Models\User;

it('lists all exercises', function (): void {
    Exercise::factory()->count(3)->create();
    $user = User::factory()->create();

    $this->actingAs($user)
        ->getJson('/api/exercises')
        ->assertOk()
        ->assertJsonCount(3, 'data')
        ->assertJsonStructure(['data' => [['id', 'name', 'icon']]]);
});

it('returns a single exercise', function (): void {
    $exercise = Exercise::factory()->create(['name' => 'Push-up']);
    $user = User::factory()->create();

    $this->actingAs($user)
        ->getJson("/api/exercises/{$exercise->id}")
        ->assertOk()
        ->assertJsonPath('data.name', 'Push-up');
});
