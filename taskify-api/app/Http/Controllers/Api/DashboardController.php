<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    private function getStatsData(Request $request): array
    {
        $orgId = $request->user()->organization_id;

        // Team members count in org
        $teamMembersCount = User::where('organization_id', $orgId)->count();

        // Active tasks count in org
        $activeTasksCount = Task::where('organization_id', $orgId)
            ->where('status', '!=', 'done')
            ->count();

        // Active tasks due this week in org
        $startOfWeek = Carbon::now()->startOfWeek(Carbon::MONDAY)->toDateString();
        $endOfWeek = Carbon::now()->endOfWeek(Carbon::SUNDAY)->toDateString();
        $dueThisWeekCount = Task::where('organization_id', $orgId)
            ->where('status', '!=', 'done')
            ->whereBetween('due_date', [$startOfWeek, $endOfWeek])
            ->count();

        // Team activity % in org
        $totalTasksCount = Task::where('organization_id', $orgId)->count();
        $completedTasksCount = Task::where('organization_id', $orgId)
            ->where('status', 'done')
            ->count();
        $teamActivityPercent = $totalTasksCount > 0 ? (int) round(($completedTasksCount / $totalTasksCount) * 100) : 0;

        return [
            'team_members_count' => $teamMembersCount,
            'active_tasks_count' => $activeTasksCount,
            'due_this_week_count' => $dueThisWeekCount,
            'team_activity_percent' => $teamActivityPercent,
        ];
    }

    private function getThroughputData(Request $request): array
    {
        $orgId = $request->user()->organization_id;
        $startOfWeek = Carbon::now()->startOfWeek(Carbon::MONDAY)->startOfDay();
        $endOfWeek = Carbon::now()->endOfWeek(Carbon::SUNDAY)->endOfDay();

        $isSqlite = DB::getDriverName() === 'sqlite';
        $dayRawCreated = $isSqlite
            ? "cast(strftime('%w', created_at) as integer) + 1"
            : "DAYOFWEEK(created_at)";
        $dayRawUpdated = $isSqlite
            ? "cast(strftime('%w', updated_at) as integer) + 1"
            : "DAYOFWEEK(updated_at)";

        $createdTasks = Task::where('organization_id', $orgId)
            ->whereBetween('created_at', [$startOfWeek, $endOfWeek])
            ->selectRaw("$dayRawCreated as day_of_week, count(*) as count")
            ->groupBy('day_of_week')
            ->pluck('count', 'day_of_week');

        $completedTasks = Task::where('organization_id', $orgId)
            ->where('status', 'done')
            ->whereBetween('updated_at', [$startOfWeek, $endOfWeek])
            ->selectRaw("$dayRawUpdated as day_of_week, count(*) as count")
            ->groupBy('day_of_week')
            ->pluck('count', 'day_of_week');

        $daysMap = [
            2 => 'Mon',
            3 => 'Tue',
            4 => 'Wed',
            5 => 'Thu',
            6 => 'Fri',
            7 => 'Sat',
            1 => 'Sun',
        ];

        $throughput = [];
        foreach (['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as $dayName) {
            $dayIndex = array_search($dayName, $daysMap);
            $throughput[] = [
                'day' => $dayName,
                'created' => (int) $createdTasks->get($dayIndex, 0),
                'completed' => (int) $completedTasks->get($dayIndex, 0),
            ];
        }

        return $throughput;
    }

    private function getWorkloadData(Request $request): array
    {
        $orgId = $request->user()->organization_id;

        $members = User::where('organization_id', $orgId)
            ->withCount(['tasks' => function ($q) use ($orgId) {
                $q->where('tasks.organization_id', $orgId)->where('status', '!=', 'done');
            }])
            ->get();

        return $members->map(function ($member) {
            return [
                'id' => (string) $member->id,
                'name' => explode(' ', $member->name)[0],
                'tasks' => (int) $member->tasks_count,
            ];
        })->toArray();
    }

    public function stats(Request $request): JsonResponse
    {
        return response()->json($this->getStatsData($request));
    }

    public function throughput(Request $request): JsonResponse
    {
        return response()->json($this->getThroughputData($request));
    }

    public function workload(Request $request): JsonResponse
    {
        return response()->json($this->getWorkloadData($request));
    }

    public function summary(Request $request): JsonResponse
    {
        return response()->json([
            'stats' => $this->getStatsData($request),
            'throughput' => $this->getThroughputData($request),
            'workload' => $this->getWorkloadData($request),
        ]);
    }
}
