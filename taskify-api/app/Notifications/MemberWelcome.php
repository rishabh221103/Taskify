<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MemberWelcome extends Notification implements ShouldQueue
{
    use Queueable;

    protected string $password;

    /**
     * Create a new notification instance.
     */
    public function __construct(string $password = 'password123')
    {
        $this->password = $password;
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
        $orgName = ($notifiable->organization && $notifiable->organization->name) 
            ? $notifiable->organization->name 
            : 'Taskify';
            
        $loginUrl = 'http://localhost:5173/login';

        return (new MailMessage)
            ->subject('Welcome to Taskify - Your Account Credentials')
            ->greeting('Welcome to Taskify, ' . $notifiable->name . '!')
            ->line('You have been added to **' . $orgName . '**\'s workspace on Taskify.')
            ->line('Your login credentials are:')
            ->line('• Email: **' . $notifiable->email . '**')
            ->line('• Password: **' . $this->password . '**')
            ->action('Log in to Taskify', $loginUrl)
            ->line('We strongly recommend that you change your password after logging in for the first time.')
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
            'email' => $notifiable->email,
        ];
    }
}
