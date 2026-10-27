"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FilePlus,
  Plus,
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
  DashboardHeader,
  DashboardSidebar,
  MobileNavigation,
} from "@/app/ui/dashboard/navigation";
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
  const [references, setReferences] = useState<References | null>(null);
  const [localProvitas, setLocalProvitas] = useState<LocalProvitas[]>([]);
  const [localLuasAreal, setLocalLuasAreal] = useState<LocalLuasAreal[]>([]);
  const [isProvitasEntryOpen, setIsProvitasEntryOpen] = useState(false);
  const [isAreaEntryOpen, setIsAreaEntryOpen] = useState(false);
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
  const sectionTitle = visibleNavigation.find(
    (item) => item.id === section
  )?.label;

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
      !record.deleted &&
      record.status !== "verified"
  );
  const pendingLuasAreal = localLuasAreal.filter(
    (record) =>
      (!record.synced_at || record.sync_error) &&
      !record.deleted &&
      record.status !== "verified"
  );
  const automaticSyncSignature =
    localProvitas
      .filter(
        (record) =>
          !record.synced_at &&
          !record.sync_error &&
          !record.deleted &&
          record.status !== "verified"
      )
      .map((record) => `${record.id}:${record.updated_at}`)
      .sort()
      .join("|") +
    "::" +
    localLuasAreal
      .filter(
        (record) =>
          !record.synced_at &&
          !record.sync_error &&
          !record.deleted &&
          record.status !== "verified"
      )
      .map((record) => `${record.id}:${record.updated_at}`)
      .sort()
      .join("|");

  async function handleSaveProvitas(record: LocalProvitas) {
    await saveLocalProvitas(user.id, record);
    setLocalProvitas(await getLocalProvitas(user.id));
    setSyncError("");
  }

  async function handleSaveLuasAreal(record: LocalLuasAreal) {
    await saveLocalLuasAreal(user.id, record);
    setLocalLuasAreal(await getLocalLuasAreal(user.id));
    setSyncError("");
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
              : !record.synced_at || record.sync_error) &&
            !record.deleted &&
            record.status !== "verified"
        );
        const pendingAreaRecords = (await getLocalLuasAreal(user.id)).filter(
          (record) =>
            (automatic
              ? !record.synced_at && !record.sync_error
              : !record.synced_at || record.sync_error) &&
            !record.deleted &&
            record.status !== "verified"
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
          result.hasil.provitas.filter((item) => item.status === "diterima")
            .length +
          result.hasil.luas_areal.filter((item) => item.status === "diterima")
            .length;
        const rejected =
          result.hasil.provitas.filter((item) => item.status === "ditolak")
            .length +
          result.hasil.luas_areal.filter((item) => item.status === "ditolak")
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
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <DashboardSidebar
          items={visibleNavigation}
          section={section}
          onSectionChange={setSection}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardHeader
            sectionTitle={sectionTitle}
            online={online}
            user={user}
            token={token}
            isLoggingOut={isLoggingOut}
            onLogout={onLogout}
            onNewNotification={loadReferences}
          />
          <MobileNavigation
            items={visibleNavigation}
            section={section}
            onSectionChange={setSection}
          />

          <div className="flex-1 px-4 py-6 sm:px-7 sm:py-8 lg:px-9">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
              {/* Header Hero Banner */}
              <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/95 to-emerald-900 p-6 sm:p-8 text-white shadow-xl shadow-primary/10">
                <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
                      {new Intl.DateTimeFormat("id-ID", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        timeZone: "Asia/Jakarta",
                      }).format(new Date())}
                    </p>
                    <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                      {section === "ringkasan"
                        ? `Selamat datang, ${user.nama}`
                        : sectionTitle}
                    </h1>
                    <p className="max-w-xl text-sm leading-relaxed text-emerald-100/90 pt-1">
                      {user.role === "ppl"
                        ? "Pantau wilayah penugasan, catat ubinan provitas, dan rekapitulasi luas areal padi."
                        : "Verifikasi pengajuan laporan lapangan dari para penyuluh pertanian."}
                    </p>
                  </div>

                  {user.role === "ppl" && (
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={() => {
                        if (section === "luas_areal") {
                          setIsAreaEntryOpen((open) => !open);
                        } else if (section === "provitas") {
                          setIsProvitasEntryOpen((open) => !open);
                        } else {
                          setSection("provitas");
                          setIsProvitasEntryOpen(true);
                        }
                      }}
                      className="self-start sm:self-center font-bold text-primary shadow-sm hover:bg-white"
                    >
                      {section === "luas_areal" ? (
                        isAreaEntryOpen ? (
                          "Tutup Formulir"
                        ) : (
                          <>
                            <FilePlus className="size-4" />
                            <span>Catat Luas Areal</span>
                          </>
                        )
                      ) : section === "provitas" && isProvitasEntryOpen ? (
                        "Tutup Formulir"
                      ) : (
                        <>
                          <Plus className="size-4" />
                          <span>Catat Provitas</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </section>

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
                references={references}
                isLoading={isLoading}
                online={online}
                provitas={visibleProvitas}
                luasAreal={visibleLuasAreal}
                pendingProvitasCount={pendingProvitas.length}
                pendingLuasArealCount={pendingLuasAreal.length}
                isProvitasEntryOpen={isProvitasEntryOpen}
                isAreaEntryOpen={isAreaEntryOpen}
                onSectionChange={setSection}
                onToggleProvitasEntry={() => setIsProvitasEntryOpen((open) => !open)}
                onToggleAreaEntry={() => setIsAreaEntryOpen((open) => !open)}
                onSaveProvitas={handleSaveProvitas}
                onSaveLuasAreal={handleSaveLuasAreal}
              />

              <footer className="flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <p>SiPadi · Sistem Informasi Pencatatan dan Validasi Padi</p>
                <p>
                  Pengguna: <strong className="text-foreground">{user.nama}</strong> ({user.role === "ppl" ? "Penyuluh Pertanian Lapangan" : "Administrator Sistem"})
                </p>
              </footer>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
