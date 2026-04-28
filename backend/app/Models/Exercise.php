<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class Exercise extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = ['name', 'group', 'icon'];

    protected function casts(): array
    {
        return [
            'created_at' => 'immutable_datetime',
        ];
    }

    public function sessionExercises(): HasMany
    {
        return $this->hasMany(SessionExercise::class);
    }

    public function performanceLogs(): HasMany
    {
        return $this->hasMany(PerformanceLog::class);
    }
}
