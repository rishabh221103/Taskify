<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::unprepared("
                CREATE TRIGGER check_organization_user_limit BEFORE INSERT ON users
                FOR EACH ROW
                BEGIN
                    DECLARE user_count INT;
                    IF NEW.organization_id IS NOT NULL THEN
                        SELECT COUNT(*) INTO user_count FROM users WHERE organization_id = NEW.organization_id;
                        IF user_count >= 5 THEN
                            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'organization_user_limit_exceeded';
                        END IF;
                    END IF;
                END
            ");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::unprepared("DROP TRIGGER IF EXISTS check_organization_user_limit");
    }
};
