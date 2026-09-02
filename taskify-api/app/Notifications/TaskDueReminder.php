<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

use App\Models\Task;

class TaskDueReminder extends Notification implements ShouldQueue
{
    use Queueable;

    protected Task $task;

    /**
     * Create a new notification instance.
     */
    public function __construct(Task $task)
    {
        $this->task = $task;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $dueDate = $this->task->due_date 
            ? $this->task->due_date->format('M d, Y') 
            : 'Not set';

        $projectName = $this->task->project 
            ? $this->task->project->name 
            : 'No Project';

        $isOwner = method_exists($notifiable, 'hasRole') && $notifiable->hasRole('owner');
        $link = $isOwner
            ? 'http://localhost:5173/admin/projects/' . $this->task->project_id
            : 'http://localhost:5173/member/tasks';

        return (new MailMessage)
            ->subject('Task Due Reminder: ' . $this->task->title)
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('This is a reminder that your task **' . $this->task->title . '** is due soon.')
            ->line('Project: ' . $projectName)
            ->line('Due Date: ' . $dueDate)
            ->action('Open Task', $link)
            ->line('Please make sure to complete it on time. Thank you!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'task_id' => $this->task->id,
            'title' => $this->task->title,
        ];
    }
}
