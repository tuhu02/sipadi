
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['provitas', 'luas_areal'] as $tableName) {

            $columnsToRemove = [
                'verified_by',
                'status',
                'verified_at',
                'catatan_verifikasi',
            ];

            if (DB::getDriverName() === 'sqlsrv') {

                // Hapus foreign key jika masih tersedia
                $foreignKeys = DB::select(
                    "SELECT DISTINCT fk.name AS constraint_name
                     FROM sys.foreign_keys fk
                     JOIN sys.foreign_key_columns fkc
                         ON fk.object_id = fkc.constraint_object_id
                     JOIN sys.columns c
                         ON c.object_id = fkc.parent_object_id
                         AND c.column_id = fkc.parent_column_id
                     WHERE fk.parent_object_id = OBJECT_ID(?)
                     AND c.name IN (?, ?, ?, ?)",
                    array_merge(
                        ["dbo.$tableName"],
                        $columnsToRemove
                    )
                );

                foreach ($foreignKeys as $fk) {
                    $name = str_replace(']', ']]', $fk->constraint_name);

                    DB::statement(
                        "ALTER TABLE [dbo].[$tableName]
                         DROP CONSTRAINT [$name]"
                    );
                }

                // Hapus default constraint
                $defaults = DB::select(
                    "SELECT dc.name AS constraint_name
                     FROM sys.default_constraints dc
                     JOIN sys.columns c
                         ON c.object_id = dc.parent_object_id
                         AND c.column_id = dc.parent_column_id
                     WHERE dc.parent_object_id = OBJECT_ID(?)
                     AND c.name IN (?, ?, ?, ?)",
                    array_merge(
                        ["dbo.$tableName"],
                        $columnsToRemove
                    )
                );

                foreach ($defaults as $default) {
                    $name = str_replace(']', ']]', $default->constraint_name);

                    DB::statement(
                        "ALTER TABLE [dbo].[$tableName]
                         DROP CONSTRAINT [$name]"
                    );
                }

                // Hapus check constraint yang menggunakan kolom tersebut
                $checks = DB::select(
                    "SELECT name AS constraint_name
                     FROM sys.check_constraints
                     WHERE parent_object_id = OBJECT_ID(?)
                     AND (
                         definition LIKE '%verified_by%'
                         OR definition LIKE '%status%'
                         OR definition LIKE '%verified_at%'
                         OR definition LIKE '%catatan_verifikasi%'
                     )",
                    ["dbo.$tableName"]
                );

                foreach ($checks as $check) {
                    $name = str_replace(']', ']]', $check->constraint_name);

                    DB::statement(
                        "ALTER TABLE [dbo].[$tableName]
                         DROP CONSTRAINT [$name]"
                    );
                }
            }

            // Hanya hapus kolom yang masih tersedia
            $existingColumns = array_values(array_filter(
                $columnsToRemove,
                fn ($column) => Schema::hasColumn($tableName, $column)
            ));

            if (!empty($existingColumns)) {
                $foreignKeys = DB::getDriverName() === 'sqlsrv'
                    ? []
                    : array_filter(
                        Schema::getForeignKeys($tableName),
                        fn ($foreignKey) => count(array_intersect(
                            $foreignKey['columns'],
                            $existingColumns
                        )) > 0
                    );

                Schema::table($tableName, function (Blueprint $table) use ($existingColumns, $foreignKeys) {
                    foreach ($foreignKeys as $foreignKey) {
                        $table->dropForeign($foreignKey['columns']);
                    }

                    $table->dropColumn($existingColumns);
                });
            }
        }
    }

    public function down(): void
    {
        foreach (['provitas', 'luas_areal'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->enum('status', [
                    'draft',
                    'submitted',
                    'verified',
                    'rejected'
                ])->default('draft');

                $table->foreignUuid('verified_by')
                    ->nullable()
                    ->constrained('users');

                $table->dateTime('verified_at')->nullable();

                $table->text('catatan_verifikasi')->nullable();
            });
        }
    }
};
