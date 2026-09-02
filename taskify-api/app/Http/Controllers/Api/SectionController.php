<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SectionResource;
use App\Models\Project;
use App\Models\Section;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SectionController extends Controller
{
    public function store(Request $request, Project $project): SectionResource
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'order' => 'nullable|integer',
        ]);

        $section = $project->sections()->create([
            'name' => $validated['name'],
            'order' => $validated['order'] ?? 0,
        ]);

        return new SectionResource($section);
    }

    public function update(Request $request, Section $section): SectionResource
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'order' => 'sometimes|required|integer',
        ]);

        $section->update($validated);

        return new SectionResource($section);
    }

    public function destroy(Section $section): JsonResponse
    {
        $section->delete();

        return response()->json(['message' => 'Section deleted successfully']);
    }
}
