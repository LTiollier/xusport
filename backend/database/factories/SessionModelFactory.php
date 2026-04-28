<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\SessionModel;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<SessionModel> */
final class SessionModelFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name'    => fake()->words(2, true),
            'user_id' => User::factory(),
        ];
    }
}
