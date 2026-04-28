<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exercises', function (Blueprint $table) {
            $table->string('group')->nullable()->after('name');
        });

        Schema::table('session_logs', function (Blueprint $table) {
            $table->integer('duration')->nullable()->after('session_model_id');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->json('settings')->nullable()->after('password');
        });
    }

    public function down(): void
    {
        Schema::table('exercises', function (Blueprint $table) {
            $table->dropColumn('group');
        });

        Schema::table('session_logs', function (Blueprint $table) {
            $table->dropColumn('duration');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('settings');
        });
    }
};
