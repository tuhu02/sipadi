import { References, SyncRecord, User } from "@/app/lib/auth";
import { AdminResource } from "@/app/lib/admin";
import { LocalLuasAreal, LocalProvitas } from "@/app/lib/offline-store";
import { AdminManagementSection } from "./admin-management-section";
import { LuasArealSection, ProvitasSection } from "./record-sections";
import { SummarySection } from "./summary-section";
import { TerritorySection } from "./territory-section";
import { DashboardSection } from "./types";

export function DashboardSectionContent({
  section,
  user,
  token,
  adminResource,
  references,
  isLoading,
  online,
  provitas,
  luasAreal,
  pendingProvitasCount,
  pendingLuasArealCount,
  isProvitasEntryOpen,
  isAreaEntryOpen,
  onToggleProvitasEntry,
  onToggleAreaEntry,
  onSaveProvitas,
  onSaveLuasAreal,
  onEditProvitas,
  onDeleteProvitas,
  onEditArea,
  onDeleteArea,
  editingProvitas,
  editingArea,
  onCancelEditProvitas,
  onCancelEditArea,
}: {
  section: DashboardSection;
  user: User;
  token: string;
  adminResource: AdminResource;
  references: References | null;
  isLoading: boolean;
  online: boolean;
  provitas: SyncRecord[];
  luasAreal: SyncRecord[];
  pendingProvitasCount: number;
  pendingLuasArealCount: number;
  isProvitasEntryOpen: boolean;
  isAreaEntryOpen: boolean;
  onToggleProvitasEntry: () => void;
  onToggleAreaEntry: () => void;
  onSaveProvitas: (record: LocalProvitas) => Promise<void>;
  onSaveLuasAreal: (record: LocalLuasAreal) => Promise<void>;
  onEditProvitas: (record: SyncRecord) => void;
  onDeleteProvitas: (record: SyncRecord) => void;
  onEditArea: (record: SyncRecord) => void;
  onDeleteArea: (record: SyncRecord) => void;
  editingProvitas: SyncRecord | null;
  editingArea: SyncRecord | null;
  onCancelEditProvitas: () => void;
  onCancelEditArea: () => void;
}) {
  const isPpl = user.role === "ppl";

  switch (section) {
    case "ringkasan":
      return (
        <SummarySection
          references={references}
          isLoading={isLoading}
          provitas={provitas}
          luasAreal={luasAreal}
        />
      );
    case "wilayah":
      return (
        <TerritorySection references={references} isLoading={isLoading} />
      );
    case "admin":
      return user.role === "admin" ? (
        <AdminManagementSection
          key={adminResource}
          token={token}
          currentUserId={user.id}
          resource={adminResource}
        />
      ) : null;
    case "provitas":
      return (
        <ProvitasSection
          references={references}
          records={provitas}
          pendingCount={pendingProvitasCount}
          isLoading={isLoading}
          isPpl={isPpl}
          isEntryOpen={isProvitasEntryOpen}
          isOnline={online}
          onToggleEntry={onToggleProvitasEntry}
          onSave={onSaveProvitas}
          onEdit={onEditProvitas}
          onDelete={onDeleteProvitas}
          editRecord={editingProvitas}
          onCancelEdit={onCancelEditProvitas}
        />
      );
    case "luas_areal":
      return (
        <LuasArealSection
          references={references}
          records={luasAreal}
          pendingCount={pendingLuasArealCount}
          isLoading={isLoading}
          isPpl={isPpl}
          isEntryOpen={isAreaEntryOpen}
          isOnline={online}
          onToggleEntry={onToggleAreaEntry}
          onSave={onSaveLuasAreal}
          onEdit={onEditArea}
          onDelete={onDeleteArea}
          editRecord={editingArea}
          onCancelEdit={onCancelEditArea}
        />
      );
  }
}
