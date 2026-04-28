<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class SessionModelResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'        => $this->id,
            'name'      => $this->name,
            'user_id'   => $this->user_id,
            'exercises' => SessionExerciseResource::collection($this->whenLoaded('sessionExercises')),
        ];
    }
}
