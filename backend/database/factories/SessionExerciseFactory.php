<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Exercise;
use App\Models\SessionExercise;
use App\Models\SessionModel;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<SessionExercise> */
final class SessionExerciseFactory extends Factory
{
    public function definition(): array
    {
        return [
            'session_model_id' => SessionModel::factory(),
            'exercise_id'      => Exercise::factory(),
            'sets_count'       => fake()->numberBetween(2, 5),
            'goal_type'        => 'fixed',
            'goal_value'       => fake()->numberBetween(5, 20),
            'rest_time'        => fake()->randomElement([30, 60, 90, 120]),
            'order'            => 0,
        ];
    }

    public function max(): static
    {
        return $this->state(['goal_type' => 'max', 'goal_value' => null]);
    }
}
