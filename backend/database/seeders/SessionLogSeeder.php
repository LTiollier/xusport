<?php

namespace Database\Seeders;

use App\Models\SessionLog;
use App\Models\SessionModel;
use App\Models\User;
use Illuminate\Database\Seeder;

class SessionLogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::first();
        $sessionModels = SessionModel::all();

        if (!$user || $sessionModels->isEmpty()) {
            SessionLog::factory(10)->create();
            return;
        }

        foreach ($sessionModels as $sessionModel) {
            SessionLog::factory(rand(1, 3))->create([
                'user_id' => $user->id,
                'session_model_id' => $sessionModel->id,
            ]);
        }
    }
}
