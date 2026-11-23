"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AdminResource } from "@/app/lib/admin";
import {
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { ApiError } from "@/app/lib/api";
import {
  getReferences,
  References,
  SyncRecord,
  syncProvitas,
  User,
} from "@/app/lib/auth";
import {
  getCachedReferences,
  getLastSync,
  getLocalLuasAreal,
  getLocalProvitas,
  LocalLuasAreal,
  LocalProvitas,
  saveCachedReferences,
  saveLastSync,
  saveLocalLuasAreal,
  saveLocalProvitas,
  updateLuasArealAfterSync,
  updateProvitasAfterSync,
} from "@/app/lib/offline-store";
import {
  DashboardSidebar,
  MobileNavigation,
} from "@/app/ui/dashboard/navigation";
import NotificationInbox from "@/app/ui/notification-inbox";
import { DashboardSectionContent } from "@/app/ui/dashboard/section-content";
import { DashboardSection, navigation } from "@/app/ui/dashboard/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type DashboardProps = {
  user: User;
  token: string;
  error: string;
  isLoggingOut: boolean;
  onLogout: () => void;
};

export default function Dashboard({
  user,
  token,
  error: logoutError,
  isLoggingOut,
  onLogout,
}: DashboardProps) {
  const [section, setSection] = useState<DashboardSection>("ringkasan");
  const [adminResource, setAdminResource] = useState<AdminResource>("users");
  const [references, setReferences] = useState<References | null>(null);
  const [localProvitas, setLocalProvitas] = useState<LocalProvitas[]>([]);
  const [localLuasAreal, setLocalLuasAreal] = useState<LocalLuasAreal[]>([]);
  const [isProvitasEntryOpen, setIsProvitasEntryOpen] = useState(false);
  const [isAreaEntryOpen, setIsAreaEntryOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [editingProvitas, setEditingProvitas] = useState<SyncRecord | null>(null);
  const [editingArea, setEditingArea] = useState<SyncRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [syncError, setSyncError] = useState("");
  const [syncMessage, setSyncMessage] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [online, setOnline] = useState(true);
  const syncInProgress = useRef(false);
  const lastAutoSyncSignature = useRef("");

  const visibleNavigation = navigation.filter(
    (item) =>
      (!item.pplOnly || user.role === "ppl") &&
      (!item.adminOnly || user.role === "admin")
  );
  const showLoadError = useCallback((requestError: unknown) => {
    if (requestError instanceof ApiError && requestError.status === 401) {
      setLoadError(
        "Sesi login sudah tidak berlaku. Silakan keluar lalu masuk kembali."
      );
    } else {
      setLoadError(
        requestError instanceof Error
          ? requestError.message
          : "Referensi belum dapat dimuat."
      );
    }
  }, []);

  const loadReferences = useCallback(async () => {
    try {
      const data = await getReferences(token);
      await saveCachedReferences(user.id, data);
      setReferences(data);
      setLoadError("");
    } catch (requestError: unknown) {
      showLoadError(requestError);
    } finally {
      setIsLoading(false);
    }
  }, [showLoadError, token, user.id]);

  useEffect(() => {
    let isMounted = true;

    async function initializeDashboard() {
      try {
        const cached = await getCachedReferences(user.id);
        if (isMounted && cached) {
          setReferences(cached);
          setIsLoading(false);
        }
      } catch (storageError: unknown) {
        if (isMounted) {
          setSyncError(
            storageError instanceof Error
              ? storageError.message
              : "Referensi lokal tidak dapat dibuka."
          );
        }
      }

      try {
        const data = await getReferences(token);
        await saveCachedReferences(user.id, data);
        if (!isMounted) return;
        setReferences(data);
        setLoadError("");
      } catch (requestError: unknown) {
        if (!isMounted) return;
        showLoadError(requestError);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void initializeDashboard();

    return () => {
      isMounted = false;
    };
  }, [showLoadError, token, user.id]);

  useEffect(() => {
    let isMounted = true;
    getLocalProvitas(user.id)
      .then((records) => {
        if (isMounted) setLocalProvitas(records);
      })
      .catch((storageError: unknown) => {
        if (isMounted) {
          setSyncError(
            storageError instanceof Error
              ? storageError.message
              : "Penyimpanan lokal tidak dapat dibuka."
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user.id]);

  useEffect(() => {
    let isMounted = true;
    getLocalLuasAreal(user.id)
      .then((records) => {
        if (isMounted) setLocalLuasAreal(records);
      })
      .catch((storageError: unknown) => {
        if (isMounted) {
          setSyncError(
            storageError instanceof Error
              ? storageError.message
              : "Penyimpanan laporan luas areal tidak dapat dibuka."
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user.id]);

  function retryLoadingReferences() {
    setIsLoading(true);
    setLoadError("");
    void loadReferences().finally(() => {
      setIsLoading(false);
    });
  }

  useEffect(() => {
    let isMounted = true;

    const initialStatus = window.setTimeout(() => {
      if (isMounted) setOnline(navigator.onLine);
    }, 0);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      isMounted = false;
      window.clearTimeout(initialStatus);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const visibleProvitas = useMemo(() => {
    const merged = new Map<string, SyncRecord>();
    for (const record of localProvitas) merged.set(record.id, record);
    for (const record of references?.provitas ?? []) {
      merged.set(record.id, record);
    }
    return [...merged.values()].filter((record) => !record.deleted);
  }, [localProvitas, references]);

  const visibleLuasAreal = useMemo(() => {
    const merged = new Map<string, SyncRecord>();
    for (const record of references?.luas_areal ?? []) {
      merged.set(record.id, record);
    }
    for (const record of localLuasAreal) merged.set(record.id, record);
    return [...merged.values()].filter((record) => !record.deleted);
  }, [localLuasAreal, references]);

  const pendingProvitas = localProvitas.filter(
    (record) =>
      (!record.synced_at || record.sync_error) &&
      !record.deleted
  );
  const pendingLuasAreal = localLuasAreal.filter(
    (record) =>
      (!record.synced_at || record.sync_error) &&
      !record.deleted
  );
  const automaticSyncSignature =
    localProvitas
      .filter(
        (record) =>
          !record.synced_at &&
          !record.sync_error
      )
      .map((record) => `${record.id}:${record.updated_at}`)
      .sort()
      .join("|") +
    "::" +
    localLuasAreal
      .filter(
        (record) =>
          !record.synced_at &&
          !record.sync_error
      )
      .map((record) => `${record.id}:${record.updated_at}`)
      .sort()
      .join("|");

  async function handleSaveProvitas(record: LocalProvitas) {
    await saveLocalProvitas(user.id, record);
    setLocalProvitas(await getLocalProvitas(user.id));
    if (editingProvitas?.id === record.id) {
      setEditingProvitas(null);
      setIsProvitasEntryOpen(false);
      toast.success("Perubahan catatan provitas berhasil disimpan.");
    }
    setSyncError("");
  }

  function handleEditProvitas(record: SyncRecord) {
    setEditingProvitas(record);
    setIsProvitasEntryOpen(true);
    setSection("provitas");
  }

  async function handleDeleteProvitas(record: SyncRecord) {
    if (!window.confirm("Hapus catatan provitas ini? Data akan dihapus setelah sinkronisasi.")) return;

    await saveLocalProvitas(user.id, {
      id: record.id,
      lahan_id: record.lahan_id ?? "",
      musim_tanam_id: record.musim_tanam_id ?? "",
      tanggal_panen: record.tanggal_panen ?? "",
      luas_petak_m2: Number(record.luas_petak_m2 ?? 0),
      berat_gabah_kg: Number(record.berat_gabah_kg ?? 0),
      kadar_air: record.kadar_air == null ? null : Number(record.kadar_air),
      catatan: record.catatan ?? null,
      provitas_kuha: Number(record.provitas_kuha ?? 0),
      updated_at: new Date().toISOString(),
      synced_at: null,
      deleted: true,
      sync_error: null,
    });
    setLocalProvitas(await getLocalProvitas(user.id));
    setSyncError("");
  }

  function handleToggleProvitasEntry() {
    if (isProvitasEntryOpen) setEditingProvitas(null);
    setIsProvitasEntryOpen(!isProvitasEntryOpen);
  }

  function handleCancelEditProvitas() {
    setEditingProvitas(null);
    setIsProvitasEntryOpen(false);
  }

  async function handleSaveLuasAreal(record: LocalLuasAreal) {
    await saveLocalLuasAreal(user.id, record);
    setLocalLuasAreal(await getLocalLuasAreal(user.id));
    if (editingArea?.id === record.id) {
      setEditingArea(null);
      setIsAreaEntryOpen(false);
      toast.success("Perubahan laporan luas areal berhasil disimpan.");
    }
    setSyncError("");
  }

  function handleEditArea(record: SyncRecord) {
    setEditingArea(record);
    setIsAreaEntryOpen(true);
    setSection("luas_areal");
  }

  async function handleDeleteArea(record: SyncRecord) {
    if (!window.confirm("Hapus laporan luas areal ini? Data akan dihapus setelah sinkronisasi.")) return;

    await saveLocalLuasAreal(user.id, {
      id: record.id,
      desa_id: record.desa_id ?? "",
      tahun: Number(record.tahun),
      bulan: Number(record.bulan),
      luas_tanam_ha: Number(record.luas_tanam_ha ?? 0),
      luas_panen_ha: Number(record.luas_panen_ha ?? 0),
      luas_puso_ha: record.luas_puso_ha == null ? null : Number(record.luas_puso_ha),
      catatan: record.catatan ?? null,
      updated_at: new Date().toISOString(),
      synced_at: null,
      deleted: true,
      sync_error: null,
    });
    setLocalLuasAreal(await getLocalLuasAreal(user.id));
    setSyncError("");
  }

  function handleToggleAreaEntry() {
    if (isAreaEntryOpen) setEditingArea(null);
    setIsAreaEntryOpen((open) => !open);
  }

  function handleCancelEditArea() {
    setEditingArea(null);
    setIsAreaEntryOpen(false);
  }

  const handleSync = useCallback(
    async (automatic = false) => {
      if (!online || !navigator.onLine || syncInProgress.current) return;

      syncInProgress.current = true;
      setIsSyncing(true);
      setSyncError("");
      if (!automatic) setSyncMessage("");

      try {
        const pendingRecords = (await getLocalProvitas(user.id)).filter(
          (record) =>
            (automatic
              ? !record.synced_at && !record.sync_error
              : !record.synced_at || record.sync_error)
        );
        const pendingAreaRecords = (await getLocalLuasAreal(user.id)).filter(
          (record) =>
            (automatic
              ? !record.synced_at && !record.sync_error
              : !record.synced_at || record.sync_error)
        );
        const lastSync = await getLastSync(user.id);
        const result = await syncProvitas(
          token,
          pendingRecords,
          lastSync,
          pendingAreaRecords
        );

        await updateProvitasAfterSync(
          user.id,
          pendingRecords,
          result.hasil.provitas,
          result.perubahan.provitas,
          result.server_time
        );
        await updateLuasArealAfterSync(
          user.id,
          pendingAreaRecords,
          result.hasil.luas_areal,
          result.perubahan.luas_areal,
          result.server_time
        );
        await saveLastSync(user.id, result.server_time);

        setLocalProvitas(await getLocalProvitas(user.id));
        setLocalLuasAreal(await getLocalLuasAreal(user.id));
        const referenceData = await getReferences(token);
        await saveCachedReferences(user.id, referenceData);
        setReferences(referenceData);

        const accepted =
          result.hasil.provitas.filter((item) => item.hasil_sync === "diterima")
            .length +
          result.hasil.luas_areal.filter((item) => item.hasil_sync === "diterima")
            .length;
        const rejected =
          result.hasil.provitas.filter((item) => item.hasil_sync === "ditolak")
            .length +
          result.hasil.luas_areal.filter((item) => item.hasil_sync === "ditolak")
            .length;

        if (
          pendingRecords.length + pendingAreaRecords.length > 0 ||
          !automatic
        ) {
          setSyncMessage(
            pendingRecords.length + pendingAreaRecords.length === 0
              ? "Sinkronisasi selesai. Status terbaru dari server sudah diperbarui."
              : `${accepted} data diterima${rejected ? `, ${rejected} data perlu diperbaiki` : ""}.`
          );
        }
      } catch (requestError: unknown) {
        setSyncError(
          requestError instanceof Error
            ? requestError.message
            : "Sinkronisasi gagal. Data tetap tersimpan di perangkat."
        );
      } finally {
        syncInProgress.current = false;
        setIsSyncing(false);
      }
    },
    [online, token, user.id]
  );

  useEffect(() => {
    if (user.role !== "ppl") return;

    if (!online) {
      lastAutoSyncSignature.current = "";
      return;
    }

    if (
      !automaticSyncSignature ||
      isSyncing ||
      lastAutoSyncSignature.current === automaticSyncSignature
    ) {
      return;
    }

    lastAutoSyncSignature.current = automaticSyncSignature;
    void handleSync(true);
  }, [automaticSyncSignature, handleSync, isSyncing, online, user.role]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      {user.role === "ppl" && (
        <div className="fixed right-4 top-4 z-50">
          <NotificationInbox
            token={token}
            userId={user.id}
            onNewNotification={loadReferences}
            open={isNotificationOpen}
            onOpenChange={setIsNotificationOpen}
            hideTrigger
          />
        </div>
      )}
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <DashboardSidebar
          items={visibleNavigation}
          section={section}
          onSectionChange={setSection}
          adminResource={adminResource}
          onAdminResourceChange={setAdminResource}
          user={user}
          isLoggingOut={isLoggingOut}
          onLogout={onLogout}
          onOpenNotifications={() => setIsNotificationOpen(true)}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileNavigation
            items={visibleNavigation}
            section={section}
            onSectionChange={setSection}
            adminResource={adminResource}
            onAdminResourceChange={setAdminResource}
            user={user}
            isLoggingOut={isLoggingOut}
            onLogout={onLogout}
            onOpenNotifications={() => setIsNotificationOpen(true)}
          />

          <div className="flex-1 px-4 py-6 sm:px-7 sm:py-8 lg:px-9">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
              {logoutError && (
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertDescription>{logoutError}</AlertDescription>
                </Alert>
              )}

              {loadError && (
                <Alert variant="destructive" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                    <div>
                      <AlertTitle className="text-sm font-semibold">Data referensi belum dapat dimuat</AlertTitle>
                      <AlertDescription className="text-xs">{loadError}</AlertDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={retryLoadingReferences}
                    disabled={isLoading}
                    className="self-start sm:self-auto shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10"
                  >
                    <RefreshCw className="size-3.5 mr-1.5" />
                    Coba lagi
                  </Button>
                </Alert>
              )}

              {syncError && (
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertDescription>{syncError}</AlertDescription>
                </Alert>
              )}

              {syncMessage && (
                <Alert variant="success">
                  <CheckCircle2 className="size-4" />
                  <AlertDescription>{syncMessage}</AlertDescription>
                </Alert>
              )}

              <DashboardSectionContent
                section={section}
                user={user}
                token={token}
                adminResource={adminResource}
                references={references}
                isLoading={isLoading}
                online={online}
                provitas={visibleProvitas}
                luasAreal={visibleLuasAreal}
                pendingProvitasCount={pendingProvitas.length}
                pendingLuasArealCount={pendingLuasAreal.length}
                isProvitasEntryOpen={isProvitasEntryOpen}
                isAreaEntryOpen={isAreaEntryOpen}
                onToggleProvitasEntry={handleToggleProvitasEntry}
                onToggleAreaEntry={handleToggleAreaEntry}
                onSaveProvitas={handleSaveProvitas}
                onSaveLuasAreal={handleSaveLuasAreal}
                onEditProvitas={handleEditProvitas}
                onDeleteProvitas={handleDeleteProvitas}
                onEditArea={handleEditArea}
                onDeleteArea={handleDeleteArea}
                editingProvitas={editingProvitas}
                editingArea={editingArea}
                onCancelEditProvitas={handleCancelEditProvitas}
                onCancelEditArea={handleCancelEditArea}
              />

              <footer className="flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <p>SiPadi · Sistem Informasi Pencatatan dan Validasi Padi</p>
              </footer>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
