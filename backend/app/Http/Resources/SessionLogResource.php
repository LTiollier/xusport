<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class SessionLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'user_id'          => $this->user_id,
            'session_model_id' => $this->session_model_id,
            'duration'         => $this->duration,
            'completed_at'     => $this->completed_at?->toIso8601String(),
            'synced_at'        => $this->synced_at?->toIso8601String(),
            'has_pb'           => $this->relationLoaded('performanceLogs')
                ? $this->performanceLogs->contains('is_pb', true)
                : $this->hasPb(),
            'performance_logs' => PerformanceLogResource::collection($this->whenLoaded('performanceLogs')),
        ];
    }
}
