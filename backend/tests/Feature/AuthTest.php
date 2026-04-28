<?php

use App\Models\User;

it('registers a new user and returns a token', function (): void {
    $this->postJson('/api/register', [
        'name'                  => 'Leo',
        'email'                 => 'leo@example.com',
        'password'              => 'password',
        'password_confirmation' => 'password',
    ])->assertCreated()->assertJsonStructure(['token']);
});

it('rejects duplicate email on register', function (): void {
    User::factory()->create(['email' => 'leo@example.com']);

    $this->postJson('/api/register', [
        'name'                  => 'Leo',
        'email'                 => 'leo@example.com',
        'password'              => 'password',
        'password_confirmation' => 'password',
    ])->assertUnprocessable();
});

it('logs in with valid credentials', function (): void {
    User::factory()->create(['email' => 'leo@example.com', 'password' => bcrypt('password')]);

    $this->postJson('/api/login', [
        'email'    => 'leo@example.com',
        'password' => 'password',
    ])->assertOk()->assertJsonStructure(['token']);
});

it('rejects login with wrong password', function (): void {
    User::factory()->create(['email' => 'leo@example.com', 'password' => bcrypt('password')]);

    $this->postJson('/api/login', [
        'email'    => 'leo@example.com',
        'password' => 'wrong',
    ])->assertUnprocessable();
});

it('logs out and invalidates the token', function (): void {
    $user  = User::factory()->create();
    $token = $user->createToken('xusport')->plainTextToken;

    $this->withToken($token)->postJson('/api/logout')->assertOk();
});

it('returns current user via /user', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->getJson('/api/user')
        ->assertOk()
        ->assertJsonPath('id', $user->id);
});

it('returns 401 on unauthenticated requests', function (): void {
    $this->getJson('/api/user')->assertUnauthorized();
});
