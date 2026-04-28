<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('session_exercises', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('session_model_id')->constrained()->cascadeOnDelete();
            $table->foreignId('exercise_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('sets_count');
            $table->string('goal_type'); // fixed | max
            $table->unsignedSmallInteger('goal_value')->nullable();
            $table->unsignedSmallInteger('rest_time'); // seconds
            $table->unsignedSmallInteger('order');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('session_exercises');
    }
};
