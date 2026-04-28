<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Exercise;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Exercise> */
final class ExerciseFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->words(2, true),
            'icon' => fake()->randomElement(['💪', '🏋️', '🤸', '🦵', '🙌']),
        ];
    }
}
