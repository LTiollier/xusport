<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class PerformanceLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'session_log_id',
        'exercise_id',
        'set_number',
        'reps_done',
        'is_pb',
    ];

    protected function casts(): array
    {
        return [
            'set_number' => 'integer',
            'reps_done' => 'integer',
            'is_pb' => 'boolean',
        ];
    }

    public function sessionLog(): BelongsTo
    {
        return $this->belongsTo(SessionLog::class);
    }

    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class);
    }
}
