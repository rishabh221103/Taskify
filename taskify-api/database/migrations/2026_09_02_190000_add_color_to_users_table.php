<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\User;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('color')->nullable()->after('title');
        });

        // Assign unique colors to existing users in each organization
        $palette = [
            '#3B82F6', // Blue
            '#8B5CF6', // Purple
            '#EC4899', // Pink
            '#10B981', // Emerald
            '#F59E0B', // Amber
            '#EF4444', // Red
            '#06B6D4', // Cyan
            '#F97316', // Orange
            '#84CC16', // Lime
            '#6366F1', // Indigo
            '#14B8A6', // Teal
            '#D946EF', // Fuchsia
            '#38BDF8', // Light Blue
            '#A855F7', // Bright Purple
            '#FB923C', // Warm Orange
            '#4ADE80', // Bright Green
            '#F43F5E', // Rose
            '#0EA5E9', // Sky Blue
        ];

        $usersByOrg = User::all()->groupBy('organization_id');

        foreach ($usersByOrg as $orgId => $users) {
            $usedColors = [];
            foreach ($users as $user) {
                if ($user->color) {
                    $usedColors[] = strtoupper($user->color);
                    continue;
                }

                $assignedColor = null;
                foreach ($palette as $colorCandidate) {
                    if (!in_array(strtoupper($colorCandidate), $usedColors)) {
                        $assignedColor = $colorCandidate;
                        break;
                    }
                }

                if (!$assignedColor) {
                    $hue = fmod(count($usedColors) * 137.508, 360);
                    $assignedColor = sprintf('hsl(%d, 75%%, 55%%)', (int) $hue);
                }

                $user->color = $assignedColor;
                $user->save();
                $usedColors[] = strtoupper($assignedColor);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('color');
        });
    }
};
