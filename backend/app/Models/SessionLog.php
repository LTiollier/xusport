<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class SessionLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'session_model_id',
        'duration',
        'completed_at',
        'synced_at',
    ];

    protected function casts(): array
    {
        return [
            'completed_at' => 'immutable_datetime',
            'synced_at' => 'immutable_datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function sessionModel(): BelongsTo
    {
        return $this->belongsTo(SessionModel::class);
    }

    public function performanceLogs(): HasMany
    {
        return $this->hasMany(PerformanceLog::class);
    }

    public function hasPb(): bool
    {
        return $this->performanceLogs()->where('is_pb', true)->exists();
    }
}
