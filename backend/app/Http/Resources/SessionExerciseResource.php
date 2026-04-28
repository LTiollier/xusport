<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class SessionExerciseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'session_model_id' => $this->session_model_id,
            'exercise_id'      => $this->exercise_id,
            'sets_count'       => $this->sets_count,
            'goal_type'        => $this->goal_type,
            'goal_value'       => $this->goal_value,
            'rest_time'        => $this->rest_time,
            'order'            => $this->order,
            'exercise'         => new ExerciseResource($this->whenLoaded('exercise')),
        ];
    }
}
