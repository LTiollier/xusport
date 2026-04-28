<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class SessionExercise extends Model
{
    use HasFactory;

    protected $fillable = [
        'session_model_id',
        'exercise_id',
        'sets_count',
        'goal_type',
        'goal_value',
        'rest_time',
        'order',
    ];

    protected function casts(): array
    {
        return [
            'sets_count' => 'integer',
            'goal_value' => 'integer',
            'rest_time' => 'integer',
            'order' => 'integer',
        ];
    }

    public function sessionModel(): BelongsTo
    {
        return $this->belongsTo(SessionModel::class);
    }

    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class);
    }
}
