<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Exercise;
use App\Models\PerformanceLog;
use App\Models\SessionLog;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<PerformanceLog> */
final class PerformanceLogFactory extends Factory
{
    public function definition(): array
    {
        return [
            'session_log_id' => SessionLog::factory(),
            'exercise_id'    => Exercise::factory(),
            'set_number'     => 1,
            'reps_done'      => fake()->numberBetween(5, 20),
            'is_pb'          => false,
        ];
    }

    public function pb(): static
    {
        return $this->state(['is_pb' => true]);
    }
}
