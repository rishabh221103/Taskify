<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\SectionController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\MemberController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\AttendanceController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Attendance
    Route::get('/attendance', [AttendanceController::class, 'index']);
    Route::post('/attendance', [AttendanceController::class, 'store']);

    // Messaging
    Route::get('/conversations', [\App\Http\Controllers\Api\MessageController::class, 'conversations']);
    Route::get('/messages/{withUser}', [\App\Http\Controllers\Api\MessageController::class, 'show']);
    Route::post('/messages', [\App\Http\Controllers\Api\MessageController::class, 'store']);

    // Member-Scoped Experience Endpoints
    Route::prefix('member')->group(function () {
        Route::get('/dashboard', [\App\Http\Controllers\Api\MemberPortalController::class, 'dashboard']);
        Route::get('/tasks', [\App\Http\Controllers\Api\MemberPortalController::class, 'tasks']);
        Route::get('/projects', [\App\Http\Controllers\Api\MemberPortalController::class, 'projects']);
        Route::get('/team', [\App\Http\Controllers\Api\MemberPortalController::class, 'team']);
        Route::patch('/tasks/{task}', [\App\Http\Controllers\Api\MemberPortalController::class, 'updateTask']);
    });

    // Task Item Actions (Subtasks, Attachments, Comments, Column Moves)
    Route::patch('/tasks/{task}/move', [TaskController::class, 'move']);
    Route::post('/tasks/{task}/attachments', [TaskController::class, 'storeAttachment']);
    Route::delete('/attachments/{attachment}', [TaskController::class, 'destroyAttachment']);
    Route::post('/tasks/{task}/subtasks', [\App\Http\Controllers\Api\SubtaskController::class, 'store']);
    Route::patch('/subtasks/{subtask}', [\App\Http\Controllers\Api\SubtaskController::class, 'update']);
    Route::delete('/subtasks/{subtask}', [\App\Http\Controllers\Api\SubtaskController::class, 'destroy']);
    Route::post('/tasks/{task}/comments', [\App\Http\Controllers\Api\TaskCommentController::class, 'store']);

    // ─────────────────────────────────────────────────────────────
    // ADMIN / OWNER ONLY ROUTES (Strictly Enforced Server-Side)
    // ─────────────────────────────────────────────────────────────
    Route::middleware('owner')->group(function () {
        // Org-wide Dashboard
        Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
        Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
        Route::get('/dashboard/throughput', [DashboardController::class, 'throughput']);
        Route::get('/dashboard/workload', [DashboardController::class, 'workload']);

        // Org-wide Projects
        Route::apiResource('projects', ProjectController::class);

        // Sections
        Route::post('/projects/{project}/sections', [SectionController::class, 'store']);
        Route::patch('/sections/{section}', [SectionController::class, 'update']);
        Route::delete('/sections/{section}', [SectionController::class, 'destroy']);

        // Org-wide Tasks
        Route::apiResource('tasks', TaskController::class);

        // Members Management
        Route::get('/members', [MemberController::class, 'index']);
        Route::post('/members/invite', [MemberController::class, 'invite']);
        Route::patch('/members/{member}', [MemberController::class, 'update']);
        Route::delete('/members/{member}', [MemberController::class, 'destroy']);
    });
});