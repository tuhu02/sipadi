import { Plus, Sparkles } from "lucide-react";
import { References, SyncRecord } from "@/app/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  LoadingRows,
  SummaryCard,
} from "./shared";
import { DashboardSection } from "./types";

const chartBounds = {
  left: 58,
  right: 620,
  top: 20,
  bottom: 220,
};

function chartNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function formatChartNumber(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 1,
  }).format(value);
}

function shortDate(value: string | undefined) {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

function areaPeriod(record: SyncRecord) {
  const month = chartNumber(record.bulan);
  const monthLabel = month >= 1 && month <= 12
    ? new Intl.DateTimeFormat("id-ID", { month: "short" }).format(
        new Date(2000, month - 1, 1),
      )
    : "—";
  return `${monthLabel} ${record.tahun ?? ""}`.trim();
}

function ProvitasChart({ records }: { records: SyncRecord[] }) {
  const latestRecords = records
    .filter((record) => !record.deleted)
    .slice()
    .sort((a, b) =>
      (a.tanggal_panen ?? "").localeCompare(b.tanggal_panen ?? ""),
    )
    .slice(-5);
  const values = latestRecords.map((record) => chartNumber(record.provitas_kuha));
  const highest = Math.max(...values, 0);
  const yMax = Math.max(10, Math.ceil(highest / 10) * 10);
  const plotWidth = chartBounds.right - chartBounds.left;
  const plotHeight = chartBounds.bottom - chartBounds.top;
  const points = values.map((value, index) => {
    const x = latestRecords.length <= 1
      ? chartBounds.left + plotWidth / 2
      : chartBounds.left + (index * plotWidth) / (latestRecords.length - 1);
    const y = chartBounds.bottom - (value / yMax) * plotHeight;
    return { x, y, value, record: latestRecords[index] };
  });

  if (latestRecords.length === 0) {
    return (
      <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Belum ada data provitas untuk ditampilkan.
      </p>
    );
  }

  return (
    <svg
      role="img"
      aria-label="Grafik tren provitas lima catatan panen terbaru, dalam kuintal per hektare"
      viewBox="0 0 640 270"
      className="h-64 w-full overflow-visible"
    >
      {[0, 0.5, 1].map((fraction) => {
        const y = chartBounds.bottom - fraction * plotHeight;
        return (
          <g key={fraction}>
            <line
              x1={chartBounds.left}
              y1={y}
              x2={chartBounds.right}
              y2={y}
              className="stroke-border"
            />
            <text
              x={chartBounds.left - 10}
              y={y + 4}
              textAnchor="end"
              className="fill-muted-foreground"
              fontSize="11"
            >
              {formatChartNumber(yMax * fraction)}
            </text>
          </g>
        );
      })}
      {points.length > 1 && (
        <polyline
          points={points.map(({ x, y }) => `${x},${y}`).join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
          className="text-primary"
        />
      )}
      {points.map(({ x, y, value, record }) => (
        <g key={record.id}>
          <circle
            cx={x}
            cy={y}
            r="5"
            fill="currentColor"
            className="text-primary"
          >
            <title>
              {`Panen ${shortDate(record.tanggal_panen)}: ${formatChartNumber(value)} Ku/Ha`}
            </title>
          </circle>
          <text
            x={x}
            y={chartBounds.bottom + 25}
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize="11"
          >
            {shortDate(record.tanggal_panen)}
          </text>
        </g>
      ))}
      <text
        x={chartBounds.left}
        y="12"
        className="fill-muted-foreground"
        fontSize="11"
      >
        Ku/Ha
      </text>
    </svg>
  );
}

function LuasArealChart({ records }: { records: SyncRecord[] }) {
  const latestRecords = records
    .filter((record) => !record.deleted)
    .slice()
    .sort(
      (a, b) =>
        Number(a.tahun ?? 0) - Number(b.tahun ?? 0) ||
        Number(a.bulan ?? 0) - Number(b.bulan ?? 0),
    )
    .slice(-5);
  const values = latestRecords.flatMap((record) => [
    chartNumber(record.luas_tanam_ha),
    chartNumber(record.luas_panen_ha),
    chartNumber(record.luas_puso_ha),
  ]);
  const highest = Math.max(...values, 0);
  const yMax = Math.max(1, Math.ceil(highest / 5) * 5);
  const plotWidth = chartBounds.right - chartBounds.left;
  const plotHeight = chartBounds.bottom - chartBounds.top;
  const barWidth = latestRecords.length > 4 ? 12 : 16;
  const barGap = 4;
  const groupWidth = barWidth * 3 + barGap * 2;
  const series = [
    { key: "tanam", label: "Tanam", color: "text-primary", field: "luas_tanam_ha" as const },
    { key: "panen", label: "Panen", color: "text-emerald-600", field: "luas_panen_ha" as const },
    { key: "puso", label: "Puso", color: "text-amber-500", field: "luas_puso_ha" as const },
  ];

  if (latestRecords.length === 0) {
    return (
      <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Belum ada laporan luas areal untuk ditampilkan.
      </p>
    );
  }

  return (
    <div>
      <svg
        role="img"
        aria-label="Grafik perbandingan luas tanam, panen, dan puso dari lima laporan bulanan terbaru, dalam hektare"
        viewBox="0 0 640 270"
        className="h-64 w-full overflow-visible"
      >
        {[0, 0.5, 1].map((fraction) => {
          const y = chartBounds.bottom - fraction * plotHeight;
          return (
            <g key={fraction}>
              <line
                x1={chartBounds.left}
                y1={y}
                x2={chartBounds.right}
                y2={y}
                className="stroke-border"
              />
              <text
                x={chartBounds.left - 10}
                y={y + 4}
                textAnchor="end"
                className="fill-muted-foreground"
                fontSize="11"
              >
                {formatChartNumber(yMax * fraction)}
              </text>
            </g>
          );
        })}
        {latestRecords.map((record, index) => {
          const step = plotWidth / latestRecords.length;
          const groupLeft =
            chartBounds.left + step * (index + 0.5) - groupWidth / 2;

          return (
            <g key={record.id}>
              {series.map((item, seriesIndex) => {
                const value = chartNumber(record[item.field]);
                const height = (value / yMax) * plotHeight;
                const x = groupLeft + seriesIndex * (barWidth + barGap);
                const y = chartBounds.bottom - height;
                return (
                  <rect
                    key={item.key}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={Math.max(height, value > 0 ? 1 : 0)}
                    rx="3"
                    fill="currentColor"
                    className={item.color}
                  >
                    <title>
                      {`${areaPeriod(record)} · ${item.label}: ${formatChartNumber(value)} ha`}
                    </title>
                  </rect>
                );
              })}
              <text
                x={chartBounds.left + step * (index + 0.5)}
                y={chartBounds.bottom + 25}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontSize="11"
              >
                {areaPeriod(record)}
              </text>
            </g>
          );
        })}
        <text
          x={chartBounds.left}
          y="12"
          className="fill-muted-foreground"
          fontSize="11"
        >
          Hektare
        </text>
      </svg>
      <div className="mt-1 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs">
        {series.map((item) => (
          <span key={item.key} className="inline-flex items-center gap-1.5">
            <span className={`size-2.5 rounded-sm ${item.color.replace("text-", "bg-")}`} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function SummarySection({
  references,
  isLoading,
  isPpl,
  provitas,
  luasAreal,
  onSectionChange,
  onStartProvitas,
}: {
  references: References | null;
  isLoading: boolean;
  isPpl: boolean;
  provitas: SyncRecord[];
  luasAreal: SyncRecord[];
  onSectionChange: (section: DashboardSection) => void;
  onStartProvitas?: () => void;
}) {
  return (
    <div className="space-y-6">
      <section
        aria-label="Ringkasan data"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <SummaryCard
          label="Desa Terjangkau"
          value={references?.desa.length}
          detail="Sesuai wilayah penugasan akun"
          icon="map"
          loading={isLoading}
        />
        <SummaryCard
          label="Lahan Tersedia"
          value={references?.lahan.length}
          detail="Petak sawah sampel binaan"
          icon="field"
          loading={isLoading}
        />
        <SummaryCard
          label="Catatan Provitas"
          value={provitas.length}
          detail="Data ubinan & panen lapangan"
          icon="chart"
          loading={isLoading}
        />
        <SummaryCard
          label="Laporan Luas Areal"
          value={luasAreal.length}
          detail="Laporan tanam, panen & puso"
          icon="leaf"
          loading={isLoading}
        />
      </section>

      {isPpl && (
        <Card className="border-primary/20 bg-gradient-to-r from-secondary/80 to-accent/40 shadow-xs">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <h3 className="text-base font-bold text-foreground">
                  Pencatatan Provitas Baru
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                Catat hasil ubinan panen dengan memilih wilayah, sampel lahan, dan musim tanam. Estimasi provitas (Ku/Ha) dihitung seketika.
              </p>
            </div>
            <Button
              onClick={onStartProvitas ? onStartProvitas : () => onSectionChange("provitas")}
              className="shrink-0 gap-2 font-semibold shadow-xs"
            >
              <Plus className="size-4" />
              Mulai Pencatatan
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="pb-3">
            <div>
              <CardTitle className="text-base font-bold">Data Provitas Terbaru</CardTitle>
              <CardDescription className="text-xs">
                Tren produktivitas lima catatan panen terbaru
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-1">
            {isLoading ? (
              <LoadingRows count={3} />
            ) : (
              <ProvitasChart records={provitas} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div>
              <CardTitle className="text-base font-bold">Laporan Luas Areal</CardTitle>
              <CardDescription className="text-xs">
                Perbandingan lima laporan bulanan terbaru (ha)
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-1">
            {isLoading ? (
              <LoadingRows count={3} />
            ) : (
              <LuasArealChart records={luasAreal} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
