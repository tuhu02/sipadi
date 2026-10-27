import {
  AlertCircle,
  BarChart3,
  Check,
  CheckCircle2,
  Clock,
  Layers,
  LayoutGrid,
  LogOut,
  MapPin,
  RefreshCw,
  Sprout,
  Wifi,
  WifiOff,
} from "lucide-react";
import { ReferenceDesa, SyncRecord } from "@/app/lib/auth";
import { Badge } from "@/components/ui/badge";
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
    case "check":
      return <CheckCircle2 className={className} />;
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

export function StatusBadge({ status }: { status: SyncRecord["status"] }) {
  switch (status) {
    case "draft":
      return (
        <Badge variant="secondary" className="font-medium">
          Draft
        </Badge>
      );
    case "submitted":
      return (
        <Badge variant="warning" className="font-medium">
          <Clock className="size-3" />
          Menunggu verifikasi
        </Badge>
      );
    case "verified":
      return (
        <Badge variant="success" className="font-medium">
          <CheckCircle2 className="size-3" />
          Terverifikasi
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="destructive" className="font-medium">
          <AlertCircle className="size-3" />
          Perlu perbaikan
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
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
}: {
  records: SyncRecord[];
  section: DashboardSection;
  emptyLabel: string;
  desa?: ReferenceDesa[];
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
              {recordTitle(record, section)}
            </p>
            <p className="text-xs text-muted-foreground">
              {section === "luas_areal"
                ? `${desa.find((item) => item.id === record.desa_id)?.nama ?? "Desa"} · Diperbarui ${formatDate(record.updated_at)}`
                : `Diperbarui ${formatDate(record.updated_at)}`}
            </p>
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
            {record.catatan_verifikasi && (
              <div className="mt-1 rounded-lg border border-destructive/20 bg-destructive/5 px-2.5 py-1 text-xs text-destructive">
                <span className="font-semibold">Catatan verifikasi:</span> {record.catatan_verifikasi}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2.5 sm:shrink-0">
            <StatusBadge status={record.status} />
            {record.synced_at && (
              <Badge variant="outline" className="text-[11px] font-normal text-muted-foreground">
                <Check className="size-3 text-emerald-600" />
                Tersinkron
              </Badge>
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
