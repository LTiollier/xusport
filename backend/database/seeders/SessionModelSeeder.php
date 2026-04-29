<?php

namespace Database\Seeders;

use App\Models\SessionModel;
use App\Models\User;
use Illuminate\Database\Seeder;

class SessionModelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::first();
        
        if ($user) {
            SessionModel::factory(5)->create(['user_id' => $user->id]);
        } else {
            SessionModel::factory(5)->create();
        }
    }
}
