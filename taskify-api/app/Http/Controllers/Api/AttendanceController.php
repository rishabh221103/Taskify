<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    /**
     * Display a listing of attendance records.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $orgId = $user->organization_id;

        // If monthly view for the logged-in user is requested
        if ($request->has('month')) {
            $month = $request->query('month'); // Expect YYYY-MM
            $records = Attendance::where('user_id', $user->id)
                ->where('date', 'like', $month . '-%')
                ->get();

            return response()->json([
                'type' => 'monthly',
                'data' => $records,
            ]);
        }

        // Default to daily view for all organization members
        $date = $request->query('date', today()->toDateString());
        $members = User::where('organization_id', $orgId)->get();
        $records = Attendance::where('organization_id', $orgId)
            ->where('date', $date)
            ->get()
            ->keyBy('user_id');

        $data = $members->map(function ($member) use ($records, $date) {
            $record = $records->get($member->id);
            return [
                'id' => (string) $member->id,
                'name' => $member->name,
                'date' => $date,
                'check_in' => $record ? $record->check_in : '--',
                'check_out' => $record ? $record->check_out : '--',
                'status' => $record ? $record->status : 'Absent',
                'hours' => $record ? $record->hours : '--',
            ];
        });

        return response()->json([
            'type' => 'daily',
            'data' => $data,
        ]);
    }

    /**
     * Store or update an attendance record.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'date' => 'required|date_format:Y-m-d',
            'check_in' => 'nullable|string',
            'check_out' => 'nullable|string',
            'status' => 'required|in:Present,Late,Absent,Half Day',
        ]);

        $user = $request->user();
        $orgId = $user->organization_id;

        // Ensure the targeted user belongs to the same organization
        $targetUser = User::findOrFail($validated['user_id']);
        if ($targetUser->organization_id !== $orgId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $hours = $this->calculateHours($validated['check_in'] ?? null, $validated['check_out'] ?? null);

        $record = Attendance::updateOrCreate(
            [
                'user_id' => $validated['user_id'],
                'date' => $validated['date'],
            ],
            [
                'organization_id' => $orgId,
                'check_in' => $validated['check_in'] ?: '--',
                'check_out' => $validated['check_out'] ?: '--',
                'status' => $validated['status'],
                'hours' => $hours,
            ]
        );

        return response()->json([
            'message' => 'Attendance updated successfully',
            'data' => $record,
        ]);
    }

    /**
     * Helper to compute total elapsed working hours.
     */
    private function calculateHours($in, $out)
    {
        if (!$in || !$out || $in === '--' || $out === '--') {
            return '--';
        }
        try {
            $parseTime = function ($str) {
                $parts = preg_split('/\s+/', trim($str));
                if (count($parts) < 2) return 0;
                [$time, $modifier] = $parts;
                [$hours, $minutes] = array_map('intval', explode(':', $time));
                if (strtoupper($modifier) === 'PM' && $hours < 12) $hours += 12;
                if (strtoupper($modifier) === 'AM' && $hours === 12) $hours = 0;
                return $hours * 60 + $minutes;
            };
            $diffMin = $parseTime($out) - $parseTime($in);
            if ($diffMin <= 0) return '--';
            $h = floor($diffMin / 60);
            $m = $diffMin % 60;
            return "{$h}h " . str_pad($m, 2, '0', STR_PAD_LEFT) . 'm';
        } catch (\Exception $e) {
            return '--';
        }
    }
}
