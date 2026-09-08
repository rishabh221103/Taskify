<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Project;

class ProjectDueReminder extends Notification implements ShouldQueue
{
    use Queueable;

    protected Project $project;

    /**
     * Create a new notification instance.
     */
    public function __construct(Project $project)
    {
        $this->project = $project;
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
        $deadline = $this->project->deadline
            ? $this->project->deadline->format('M d, Y')
            : 'Today/Tomorrow';

        $isOwner = method_exists($notifiable, 'hasRole') && $notifiable->hasRole('owner');
        $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');
        $link = $isOwner
            ? $frontendUrl . '/admin/projects/' . $this->project->id
            : $frontendUrl . '/member/projects/' . $this->project->id;

        $statusText = ucfirst(str_replace('_', ' ', $this->project->status));

        return (new MailMessage)
            ->subject('Project Deadline Reminder: ' . $this->project->name)
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('This is a reminder that the project **' . $this->project->name . '** is nearing its deadline.')
            ->line('Deadline: ' . $deadline)
            ->line('Current Status: ' . $statusText)
            ->action('View Project', $link)
            ->line('Thank you for using Taskify!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'project_id' => $this->project->id,
            'name' => $this->project->name,
            'deadline' => $this->project->deadline ? $this->project->deadline->toDateString() : null,
        ];
    }
}
