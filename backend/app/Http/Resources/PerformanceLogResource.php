<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class PerformanceLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'session_log_id' => $this->session_log_id,
            'exercise_id'    => $this->exercise_id,
            'set_number'     => $this->set_number,
            'reps_done'      => $this->reps_done,
            'is_pb'          => $this->is_pb,
        ];
    }
}
