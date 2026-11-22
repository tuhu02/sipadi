<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const ACTIVE_INDEX = 'provitas_lahan_musim_tanam_active_unique';

    public function up(): void
    {
        $this->supportedDriver();
        $duplicates = $this->duplicateGroups(
            ['lahan_id', 'musim_tanam_id'],
            activeOnly: true,
        );

        if ($duplicates->isNotEmpty()) {
            throw new \RuntimeException(
                'Provitas has multiple active records for the same land and season. '
                .'Review these groups in Admin > Kelola data > Provitas, keep one record per group, '
                .'and soft-delete the extras before rerunning the migration: '
                .$this->formatGroups($duplicates, ['lahan_id', 'musim_tanam_id']),
            );
        }

        Schema::table('provitas', function (Blueprint $table) {
            $table->dropUnique(['lahan_id', 'musim_tanam_id', 'tanggal_panen']);
        });

        $this->createActiveIndex();
    }

    public function down(): void
    {
        $driver = $this->supportedDriver();
        $duplicates = $this->duplicateGroups(
            ['lahan_id', 'musim_tanam_id', 'tanggal_panen'],
            activeOnly: false,
        );

        if ($duplicates->isNotEmpty()) {
            throw new \RuntimeException(
                'Cannot restore the previous provitas uniqueness rule because duplicate land, season, '
                .'and harvest-date groups exist: '
                .$this->formatGroups($duplicates, ['lahan_id', 'musim_tanam_id', 'tanggal_panen']),
            );
        }

        $this->dropActiveIndex($driver);
        Schema::table('provitas', function (Blueprint $table) {
            $table->unique(['lahan_id', 'musim_tanam_id', 'tanggal_panen']);
        });
    }

    private function supportedDriver(): string
    {
        $driver = DB::connection()->getDriverName();
        if (! in_array($driver, ['sqlite', 'sqlsrv'], true)) {
            throw new \RuntimeException("Unsupported database driver for the provitas index: {$driver}.");
        }

        return $driver;
    }

    private function duplicateGroups(array $columns, bool $activeOnly)
    {
        $query = DB::table('provitas')
            ->select($columns)
            ->selectRaw('COUNT(*) AS total')
            ->groupBy($columns)
            ->havingRaw('COUNT(*) > 1');

        if ($activeOnly) {
            $query->where('deleted', false);
        }

        return $query->get();
    }

    private function formatGroups($groups, array $columns): string
    {
        return $groups->map(function ($group) use ($columns) {
            $values = array_map(
                fn (string $column) => "{$column}={$group->{$column}}",
                $columns,
            );

            return implode(', ', [...$values, "count={$group->total}"]);
        })->implode('; ');
    }

    private function createActiveIndex(): void
    {
        DB::statement(
            'CREATE UNIQUE INDEX '.self::ACTIVE_INDEX
            .' ON provitas (lahan_id, musim_tanam_id) WHERE deleted = 0',
        );
    }

    private function dropActiveIndex(string $driver): void
    {
        if ($driver === 'sqlsrv') {
            DB::statement('DROP INDEX '.self::ACTIVE_INDEX.' ON provitas');
            return;
        }

        DB::statement('DROP INDEX IF EXISTS '.self::ACTIVE_INDEX);
    }
};
