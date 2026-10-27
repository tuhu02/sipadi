<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')->where('role', 'sp')->update(['role' => 'admin']);
        if (DB::getDriverName() === 'sqlsrv') {
            DB::statement("DECLARE @constraint nvarchar(128);
                SELECT TOP 1 @constraint = cc.name
                FROM sys.check_constraints cc
                INNER JOIN sys.tables t ON t.object_id = cc.parent_object_id
                WHERE t.name = 'users' AND cc.definition LIKE '%role%';
                IF @constraint IS NOT NULL EXEC('ALTER TABLE users DROP CONSTRAINT ' + @constraint);");
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK ([role] IN ('ppl', 'admin'))");
        } elseif (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY role ENUM('ppl', 'admin') NOT NULL");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlsrv') {
            DB::statement("DECLARE @constraint nvarchar(128);
                SELECT TOP 1 @constraint = cc.name
                FROM sys.check_constraints cc
                INNER JOIN sys.tables t ON t.object_id = cc.parent_object_id
                WHERE t.name = 'users' AND cc.definition LIKE '%role%';
                IF @constraint IS NOT NULL EXEC('ALTER TABLE users DROP CONSTRAINT ' + @constraint);");
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK ([role] IN ('ppl', 'sp'))");
        } elseif (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY role ENUM('ppl', 'sp') NOT NULL");
        }
        DB::table('users')->where('role', 'admin')->update(['role' => 'sp']);
    }
};
