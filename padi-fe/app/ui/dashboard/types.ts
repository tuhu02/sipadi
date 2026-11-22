import { SyncRecord } from "@/app/lib/auth";
import { AdminResource } from "@/app/lib/admin";

export type DashboardSection =
  | "ringkasan"
  | "wilayah"
  | "provitas"
  | "luas_areal"
  | "admin";

export type DashboardIconName =
  | "grid"
  | "map"
  | "chart"
  | "field"
  | "refresh"
  | "logout"
  | "leaf"
  | "settings";

export type DashboardNavigationItem = {
  id: DashboardSection;
  label: string;
  icon: DashboardIconName;
  pplOnly?: boolean;
  adminOnly?: boolean;
};

export const adminNavigationItems: {
  id: AdminResource;
  label: string;
}[] = [
  { id: "users", label: "Akun" },
  { id: "kecamatan", label: "Kecamatan" },
  { id: "desa", label: "Desa" },
  { id: "lahan", label: "Lahan" },
  { id: "provitas", label: "Provitas" },
  { id: "luas-areal", label: "Luas Areal" },
  { id: "musim-tanam", label: "Musim Tanam" },
  { id: "penugasan", label: "Penugasan" },
];

export const navigation: DashboardNavigationItem[] = [
  { id: "ringkasan", label: "Ringkasan", icon: "grid" },
  { id: "wilayah", label: "Wilayah & lahan", icon: "map" },
  { id: "provitas", label: "Data provitas", icon: "chart", pplOnly: true },
  { id: "luas_areal", label: "Luas areal", icon: "field", pplOnly: true },
  { id: "admin", label: "Kelola data", icon: "settings", adminOnly: true },
];

export function recordTitle(record: SyncRecord, section: DashboardSection) {
  if (section === "provitas") {
    return `Panen ${record.tanggal_panen ?? "—"}`;
  }
  return `Laporan ${record.bulan ?? "—"}/${record.tahun ?? "—"}`;
}
