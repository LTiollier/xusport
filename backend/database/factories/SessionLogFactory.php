<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\SessionLog;
use App\Models\SessionModel;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<SessionLog> */
final class SessionLogFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id'          => User::factory(),
            'session_model_id' => SessionModel::factory(),
            'completed_at'     => fake()->dateTimeBetween('-30 days', 'now'),
            'synced_at'        => now(),
        ];
    }
}
