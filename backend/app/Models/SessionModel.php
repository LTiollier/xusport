<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class SessionModel extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'user_id'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function sessionExercises(): HasMany
    {
        return $this->hasMany(SessionExercise::class)->orderBy('order');
    }

    public function sessionLogs(): HasMany
    {
        return $this->hasMany(SessionLog::class);
    }
}
