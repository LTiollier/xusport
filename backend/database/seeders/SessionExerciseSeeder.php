<?php

namespace Database\Seeders;

use App\Models\Exercise;
use App\Models\SessionExercise;
use App\Models\SessionModel;
use Illuminate\Database\Seeder;

class SessionExerciseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $sessionModels = SessionModel::all();
        $exercises = Exercise::all();

        if ($sessionModels->isEmpty() || $exercises->isEmpty()) {
            SessionExercise::factory(20)->create();
            return;
        }

        foreach ($sessionModels as $sessionModel) {
            $randomExercises = $exercises->random(min($exercises->count(), rand(2, 5)));
            $order = 0;
            foreach ($randomExercises as $exercise) {
                SessionExercise::factory()->create([
                    'session_model_id' => $sessionModel->id,
                    'exercise_id' => $exercise->id,
                    'order' => $order++,
                ]);
            }
        }
    }
}
