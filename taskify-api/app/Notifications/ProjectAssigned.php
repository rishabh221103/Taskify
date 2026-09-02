<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

use App\Models\Project;

class ProjectAssigned extends Notification implements ShouldQueue
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
        $description = $this->project->description ?: 'No description provided.';
        $isOwner = method_exists($notifiable, 'hasRole') && $notifiable->hasRole('owner');
        $link = $isOwner
            ? 'http://localhost:5173/admin/projects/' . $this->project->id
            : 'http://localhost:5173/member/projects';

        return (new MailMessage)
            ->subject('New Project Assignment: ' . $this->project->name)
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('You have been assigned as the manager for the project: **' . $this->project->name . '**')
            ->line('Description: ' . $description)
            ->action('Open Project', $link)
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
        ];
    }
}
