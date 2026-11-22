import {
  BarChart3,
  Check,
  Layers,
  LayoutGrid,
  LogOut,
  MapPin,
  Pencil,
  RefreshCw,
  Settings2,
  Sprout,
  Wifi,
  WifiOff,
} from "lucide-react";
import { ReferenceDesa, SyncRecord } from "@/app/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { DashboardIconName, DashboardSection, recordTitle } from "./types";

export function Icon({
  name,
  className = "size-5",
}: {
  name: DashboardIconName;
  className?: string;
}) {
  switch (name) {
    case "grid":
      return <LayoutGrid className={className} />;
    case "map":
      return <MapPin className={className} />;
    case "chart":
      return <BarChart3 className={className} />;
    case "field":
      return <Layers className={className} />;
    case "refresh":
      return <RefreshCw className={className} />;
    case "logout":
      return <LogOut className={className} />;
    case "leaf":
      return <Sprout className={className} />;
    case "settings":
      return <Settings2 className={className} />;
    default:
      return null;
  }
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "Belum tersinkron";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Waktu tidak tersedia";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatDateOnly(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatMeasurement(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "—";

  const number = Number(value);
  if (!Number.isFinite(number)) return "—";

  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(number);
}

export function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary shadow-xs">
        <Sprout className="size-5 text-primary" />
      </div>
      <div>
        <p className="text-base font-bold tracking-tight text-foreground">SiPadi</p>
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          Pencatatan Padi
        </p>
      </div>
    </div>
  );
}

export function StatusPill({ online }: { online: boolean }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border transition-colors",
        online
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-amber-200 bg-amber-50 text-amber-800"
      )}
      role="status"
    >
      {online ? (
        <>
          <Wifi className="size-3.5 text-emerald-600" />
          <span>Online</span>
        </>
      ) : (
        <>
          <WifiOff className="size-3.5 text-amber-600" />
          <span>Offline</span>
        </>
      )}
    </div>
  );
}

export function RecordList({
  records,
  section,
  emptyLabel,
  desa = [],
  onEdit,
}: {
  records: SyncRecord[];
  section: DashboardSection;
  emptyLabel: string;
  desa?: ReferenceDesa[];
  onEdit?: (record: SyncRecord) => void;
}) {
  if (records.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center bg-card/50">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          {section === "provitas" ? (
            <BarChart3 className="size-6" />
          ) : (
            <Layers className="size-6" />
          )}
        </div>
        <p className="mt-3 text-sm font-semibold text-foreground">Belum ada data</p>
        <p className="mt-1 text-xs text-muted-foreground">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-border/60">
      {records.map((record) => (
        <article
          key={record.id}
          className="flex flex-col gap-3 py-4 first:pt-1 last:pb-1 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-muted/30 rounded-xl px-2"
        >
          <div className="min-w-0 space-y-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {section === "provitas"
                ? `Panen ${formatDateOnly(record.tanggal_panen)}`
                : recordTitle(record, section)}
            </p>
            <p className="text-xs text-muted-foreground">
              {section === "luas_areal"
                ? `${desa.find((item) => item.id === record.desa_id)?.nama ?? "Desa"} · Diperbarui ${formatDate(record.updated_at)}`
                : `Diperbarui ${formatDate(record.updated_at)}`}
            </p>
            {section === "provitas" && (
              <p className="text-xs text-muted-foreground">
                Provitas{" "}
                <span className="font-medium text-foreground">
                  {formatMeasurement(record.provitas_kuha)} Ku/Ha
                </span>
              </p>
            )}
            {section === "luas_areal" && (
              <p className="text-xs text-muted-foreground">
                Tanam <span className="font-medium text-foreground">{record.luas_tanam_ha ?? 0} ha</span> · Panen{" "}
                <span className="font-medium text-foreground">{record.luas_panen_ha ?? 0} ha</span> · Puso{" "}
                <span className="font-medium text-foreground">{record.luas_puso_ha ?? 0} ha</span>
              </p>
            )}
            {record.sync_error && (
              <p className="text-xs font-medium text-destructive">
                Sinkronisasi: {record.sync_error}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2.5 sm:shrink-0">
            {record.synced_at && (
              <Badge
                variant="outline"
                title="Tersinkron"
                role="img"
                aria-label="Tersinkron"
                className="size-8 justify-center rounded-full p-0 text-emerald-700"
              >
                <Check className="size-3 text-emerald-600" />
              </Badge>
            )}
            {onEdit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEdit(record)}
                className="gap-1.5"
              >
                <Pencil className="size-3.5" />
                Edit
              </Button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

export function SummaryCard({
  label,
  value,
  detail,
  icon,
  loading,
}: {
  label: string;
  value: number | undefined;
  detail: string;
  icon: DashboardIconName;
  loading: boolean;
}) {
  return (
    <Card className="p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          {loading ? (
            <Skeleton className="mt-3 h-8 w-14" />
          ) : (
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
              {value ?? 0}
            </p>
          )}
        </div>
        <div className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
          <Icon name={icon} className="size-5" />
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{detail}</p>
    </Card>
  );
}

export function LoadingRows({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-label="Memuat data">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-4 p-3 rounded-xl border border-border/50"
        >
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function EmptyNotice({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
