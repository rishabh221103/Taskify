<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

use App\Models\Task;
use App\Notifications\TaskDueReminder;
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
    protected $description = 'Send daily email reminders for tasks due today or tomorrow';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting task due date reminders check...');

        $tomorrow = today()->addDay()->toDateString();
        $today = today()->toDateString();

        $tasks = Task::with('assignees')
            ->where('status', '!=', 'done')
            ->whereNull('reminder_sent_at')
            ->where(function($query) use ($today, $tomorrow) {
                $query->whereDate('due_date', $tomorrow)
                      ->orWhereDate('due_date', $today);
            })
            ->get();

        $count = 0;

        foreach ($tasks as $task) {
            $assignees = $task->assignees;

            if ($assignees->isEmpty()) {
                continue;
            }

            foreach ($assignees as $assignee) {
                $assignee->notify(new TaskDueReminder($task));
                $count++;
            }

            // Set the reminder_sent_at timestamp to prevent duplicates
            $task->update(['reminder_sent_at' => now()]);
        }

        $this->info("Successfully sent {$count} task due reminders.");
    }
}
