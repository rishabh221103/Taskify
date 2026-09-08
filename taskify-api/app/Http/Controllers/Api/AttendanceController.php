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

        // If user is not an owner, they cannot mark attendance for another user via this admin endpoint
        if ((int)$validated['user_id'] !== $user->id && !$user->hasRole('owner')) {
            return response()->json([
                'message' => 'Unauthorized. Only organization owners can manage other members\' attendance.'
            ], 403);
        }

        // Ensure the targeted user belongs to the same organization
        $targetUser = User::findOrFail($validated['user_id']);
        if ($targetUser->organization_id !== $orgId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $checkIn = !empty($validated['check_in']) ? $validated['check_in'] : '--';
        $checkOut = !empty($validated['check_out']) ? $validated['check_out'] : '--';
        $hours = $this->calculateHours($checkIn, $checkOut);

        $record = Attendance::updateOrCreate(
            [
                'organization_id' => $orgId,
                'user_id' => $validated['user_id'],
                'date' => $validated['date'],
            ],
            [
                'check_in' => $checkIn,
                'check_out' => $checkOut,
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
     * Display attendance history and today's status for the logged-in member.
     */
    public function myAttendance(Request $request): JsonResponse
    {
        $user = $request->user();
        $todayStr = today()->toDateString();
        $month = $request->query('month', now()->format('Y-m'));

        $monthlyRecords = Attendance::where('user_id', $user->id)
            ->where('organization_id', $user->organization_id)
            ->where('date', 'like', $month . '-%')
            ->orderBy('date', 'desc')
            ->get();

        $todayRecord = Attendance::where('user_id', $user->id)
            ->where('organization_id', $user->organization_id)
            ->where('date', $todayStr)
            ->first();

        // Calculate statistics for the user in this month
        $totalPresent = $monthlyRecords->whereIn('status', ['Present', 'Late', 'Half Day'])->count();
        $totalLate = $monthlyRecords->where('status', 'Late')->count();
        $totalAbsent = $monthlyRecords->where('status', 'Absent')->count();
        $daysRecorded = $monthlyRecords->count();
        $attendanceRate = $daysRecorded > 0 ? round(($totalPresent / $daysRecorded) * 100) : 100;

        // Streak: consecutive work days present/late
        $allRecentRecords = Attendance::where('user_id', $user->id)
            ->where('organization_id', $user->organization_id)
            ->orderBy('date', 'desc')
            ->take(30)
            ->get();

        $streak = 0;
        foreach ($allRecentRecords as $rec) {
            if (in_array($rec->status, ['Present', 'Late'])) {
                $streak++;
            } else {
                break;
            }
        }

        return response()->json([
            'today' => $todayRecord ? [
                'id' => $todayRecord->id,
                'date' => $todayRecord->date ? $todayRecord->date->format('Y-m-d') : $todayStr,
                'check_in' => $todayRecord->check_in,
                'check_out' => $todayRecord->check_out,
                'status' => $todayRecord->status,
                'hours' => $todayRecord->hours,
            ] : null,
            'records' => $monthlyRecords,
            'stats' => [
                'present_days' => $totalPresent,
                'late_days' => $totalLate,
                'absent_days' => $totalAbsent,
                'attendance_rate' => $attendanceRate,
                'streak' => $streak,
            ],
        ]);
    }

    /**
     * Self-service attendance marking for the logged-in member.
     */
    public function markMyAttendance(Request $request): JsonResponse
    {
        $user = $request->user();

        // Tampering protection: if a different user_id was explicitly provided, reject with 403
        if ($request->has('user_id') && (int)$request->input('user_id') !== $user->id) {
            return response()->json([
                'message' => 'Unauthorized. You can only mark attendance for yourself.'
            ], 403);
        }

        $validated = $request->validate([
            'date' => 'nullable|date_format:Y-m-d',
            'check_in' => 'nullable|string',
            'check_out' => 'nullable|string',
            'status' => 'nullable|in:Present,Late,Absent,Half Day',
        ]);

        $date = $validated['date'] ?? today()->toDateString();
        $status = $validated['status'] ?? 'Present';

        // Retrieve existing record if any for this date
        $existing = Attendance::where('organization_id', $user->organization_id)
            ->where('user_id', $user->id)
            ->where('date', $date)
            ->first();

        // Determine check_in
        $checkIn = $validated['check_in'] ?? ($existing ? $existing->check_in : null);
        if (!$checkIn && $status !== 'Absent') {
            $checkIn = now()->format('h:i A');
        }
        if (!$checkIn) {
            $checkIn = '--';
        }

        // Determine check_out
        $checkOut = $validated['check_out'] ?? ($existing ? $existing->check_out : '--');
        if (empty($checkOut)) {
            $checkOut = '--';
        }

        $hours = $this->calculateHours($checkIn, $checkOut);

        $record = Attendance::updateOrCreate(
            [
                'organization_id' => $user->organization_id,
                'user_id' => $user->id,
                'date' => $date,
            ],
            [
                'check_in' => $checkIn,
                'check_out' => $checkOut,
                'status' => $status,
                'hours' => $hours,
            ]
        );

        return response()->json([
            'message' => 'Attendance recorded successfully.',
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
