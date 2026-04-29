<?php

namespace Database\Seeders;

use App\Models\Exercise;
use App\Models\PerformanceLog;
use App\Models\SessionLog;
use Illuminate\Database\Seeder;

class PerformanceLogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $sessionLogs = SessionLog::all();
        $exercises = Exercise::all();

        if ($sessionLogs->isEmpty() || $exercises->isEmpty()) {
            PerformanceLog::factory(20)->create();
            return;
        }

        foreach ($sessionLogs as $sessionLog) {
            $sessionModel = $sessionLog->sessionModel;
            $sessionExercises = $sessionModel ? $sessionModel->sessionExercises : collect();
            
            $exercisesToLog = $sessionExercises->isNotEmpty() 
                ? $sessionExercises->map->exercise 
                : $exercises->random(min($exercises->count(), rand(2, 4)));

            foreach ($exercisesToLog as $exercise) {
                if (!$exercise) continue;

                $sets = rand(2, 4);
                for ($set = 1; $set <= $sets; $set++) {
                    PerformanceLog::factory()->create([
                        'session_log_id' => $sessionLog->id,
                        'exercise_id' => $exercise->id,
                        'set_number' => $set,
                    ]);
                }
            }
        }
    }
}
