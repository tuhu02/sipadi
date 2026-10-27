import { SyncRecord } from "@/app/lib/auth";

export type DashboardSection =
  | "ringkasan"
  | "wilayah"
  | "provitas"
  | "luas_areal"
  | "verifikasi";

export type DashboardIconName =
  | "grid"
  | "map"
  | "chart"
  | "field"
  | "refresh"
  | "logout"
  | "leaf"
  | "check";

export type DashboardNavigationItem = {
  id: DashboardSection;
  label: string;
  icon: DashboardIconName;
  pplOnly?: boolean;
  adminOnly?: boolean;
};

export const navigation: DashboardNavigationItem[] = [
  { id: "ringkasan", label: "Ringkasan", icon: "grid" },
  { id: "wilayah", label: "Wilayah & lahan", icon: "map" },
  { id: "provitas", label: "Data provitas", icon: "chart", pplOnly: true },
  { id: "luas_areal", label: "Luas areal", icon: "field", pplOnly: true },
  { id: "verifikasi", label: "Verifikasi", icon: "check", adminOnly: true },
];

export function recordTitle(record: SyncRecord, section: DashboardSection) {
  if (section === "provitas") {
    return `Panen ${record.tanggal_panen ?? "—"}`;
  }
  return `Laporan ${record.bulan ?? "—"}/${record.tahun ?? "—"}`;
}
