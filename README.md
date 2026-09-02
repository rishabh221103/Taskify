# Taskify

Taskify is a full-stack, multi-role project management SaaS platform inspired by tools like Asana and ClickUp. It supports both **Admin (Owner)** and **Member** roles, each with a tailored, permission-scoped experience — all backed by a fully dynamic, database-driven architecture.

## Features

- **Role-based access** — Owners get full organization-wide visibility (all projects, tasks, and members); Members see only what's assigned to them.
- **Project & task management** — Kanban-style Board view, List view with sections, Timeline, and Gantt views.
- **Dynamic dashboards** — Live stats, weekly throughput charts, and team workload breakdowns computed directly from real data.
- **Task details** — Assignees (multi-select), due dates, priorities, subtasks, attachments, and comments — synced consistently between Admin and Member views.
- **Calendar integration** — Tasks automatically appear on their due dates across the app.
- **Team & attendance management** — Member profiles with roles/titles, editable details, and attendance tracking.
- **Messaging** — Admins can message any member; members can message the admin.
- **Automated emails** — Welcome emails with login credentials for new members, task/project assignment notifications, and due-date reminders (via queued Laravel notifications).
- **Secure authentication** — Token-based (Sanctum) auth with per-tab session isolation and strict backend-enforced role permissions.

## Tech Stack

**Frontend:** React 19, Vite, React Router, Tailwind CSS, Recharts  
**Backend:** Laravel, MySQL  
**Auth:** Laravel Sanctum (Bearer token-based)  
**Email:** Laravel Notifications (queued), Mailtrap for development

## Getting Started

```bash
# Backend
cd taskify-api
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve

# Queue worker (for emails)
php artisan queue:work

# Frontend
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to get started.