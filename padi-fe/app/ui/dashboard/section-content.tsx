import { References, SyncRecord, User } from "@/app/lib/auth";
import { LocalLuasAreal, LocalProvitas } from "@/app/lib/offline-store";
import AdminVerification from "@/app/ui/admin-verification";
import { LuasArealSection, ProvitasSection } from "./record-sections";
import { SummarySection } from "./summary-section";
import { TerritorySection } from "./territory-section";
import { DashboardSection } from "./types";

export function DashboardSectionContent({
  section,
  user,
  token,
  references,
  isLoading,
  online,
  provitas,
  luasAreal,
  pendingProvitasCount,
  pendingLuasArealCount,
  isProvitasEntryOpen,
  isAreaEntryOpen,
  onSectionChange,
  onToggleProvitasEntry,
  onToggleAreaEntry,
  onSaveProvitas,
  onSaveLuasAreal,
}: {
  section: DashboardSection;
  user: User;
  token: string;
  references: References | null;
  isLoading: boolean;
  online: boolean;
  provitas: SyncRecord[];
  luasAreal: SyncRecord[];
  pendingProvitasCount: number;
  pendingLuasArealCount: number;
  isProvitasEntryOpen: boolean;
  isAreaEntryOpen: boolean;
  onSectionChange: (section: DashboardSection) => void;
  onToggleProvitasEntry: () => void;
  onToggleAreaEntry: () => void;
  onSaveProvitas: (record: LocalProvitas) => Promise<void>;
  onSaveLuasAreal: (record: LocalLuasAreal) => Promise<void>;
}) {
  const isPpl = user.role === "ppl";

  switch (section) {
    case "verifikasi":
      return user.role === "admin" ? <AdminVerification token={token} /> : null;
    case "ringkasan":
      return (
        <SummarySection
          references={references}
          isLoading={isLoading}
          isPpl={isPpl}
          provitas={provitas}
          luasAreal={luasAreal}
          onSectionChange={onSectionChange}
          onStartProvitas={() => {
            onSectionChange("provitas");
            if (!isProvitasEntryOpen) onToggleProvitasEntry();
          }}
        />
      );
    case "wilayah":
      return (
        <TerritorySection references={references} isLoading={isLoading} />
      );
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
        />
      );
  }
}
