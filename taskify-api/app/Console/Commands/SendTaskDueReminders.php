<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

use App\Models\Task;
use App\Models\Project;
use App\Notifications\TaskDueReminder;
use App\Notifications\ProjectDueReminder;
use Illuminate\Support\Facades\Notification;

class SendTaskDueReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:send-task-due-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send daily email reminders for tasks and projects due today or tomorrow';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting task and project due date reminders check...');

        $tomorrow = today()->addDay()->toDateString();
        $today = today()->toDateString();

        // 1. Process Task Due Reminders
        $tasks = Task::with('assignees')
            ->where('status', '!=', 'done')
            ->whereNull('reminder_sent_at')
            ->where(function($query) use ($today, $tomorrow) {
                $query->whereDate('due_date', $tomorrow)
                      ->orWhereDate('due_date', $today);
            })
            ->get();

        $taskReminderCount = 0;

        foreach ($tasks as $task) {
            $assignees = $task->assignees;

            if ($assignees->isEmpty()) {
                continue;
            }

            Notification::send($assignees, new TaskDueReminder($task));
            $taskReminderCount += $assignees->count();

            // Set the reminder_sent_at timestamp to prevent duplicates
            $task->update(['reminder_sent_at' => now()]);
        }

        // 2. Process Project Deadline Reminders
        $projects = Project::with(['users', 'manager'])
            ->where('status', '!=', 'completed')
            ->whereNull('reminder_sent_at')
            ->where(function($query) use ($today, $tomorrow) {
                $query->whereDate('deadline', $tomorrow)
                      ->orWhereDate('deadline', $today);
            })
            ->get();

        $projectReminderCount = 0;

        foreach ($projects as $project) {
            $recipients = collect($project->users);
            if ($project->manager) {
                $recipients->push($project->manager);
            }
            $recipients = $recipients->unique('id')->values();

            if ($recipients->isEmpty()) {
                continue;
            }

            Notification::send($recipients, new ProjectDueReminder($project));
            $projectReminderCount += $recipients->count();

            // Set the reminder_sent_at timestamp to prevent duplicates
            $project->update(['reminder_sent_at' => now()]);
        }

        $this->info("Successfully sent {$taskReminderCount} task due reminders and {$projectReminderCount} project deadline reminders.");
    }
}
