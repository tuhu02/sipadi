"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  Loader2,
  RefreshCw,
  Sprout,
  User,
  XCircle,
} from "lucide-react";
import {
  getPendingVerifications,
  reviewSubmission,
  VerificationPage,
  VerificationRecord,
} from "@/app/lib/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type SubmissionType = "provitas" | "luas-areal";
type VerificationTab = "provitas" | "luas-areal";

type AdminVerificationProps = {
  token: string;
};

const months = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export default function AdminVerification({ token }: AdminVerificationProps) {
  const [tab, setTab] = useState<VerificationTab>("provitas");
  const [provitas, setProvitas] = useState<VerificationRecord[]>([]);
  const [luasAreal, setLuasAreal] = useState<VerificationRecord[]>([]);
  const [provitasPage, setProvitasPage] = useState<VerificationPage | null>(null);
  const [luasArealPage, setLuasArealPage] = useState<VerificationPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [activeAction, setActiveAction] = useState("");

  // Reject Modal State
  const [rejectItem, setRejectItem] = useState<{
    id: string;
    type: SubmissionType;
    label: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const loadSubmissions = useCallback(async () => {
    setIsLoading(true);
    setLoadingError("");

    try {
      const [provitasResult, areaResult] = await Promise.all([
        getPendingVerifications(token, "provitas"),
        getPendingVerifications(token, "luas-areal"),
      ]);
      setProvitasPage(provitasResult);
      setLuasArealPage(areaResult);
      setProvitas(provitasResult.data);
      setLuasAreal(areaResult.data);
    } catch (error: unknown) {
      setLoadingError(
        error instanceof Error
          ? error.message
          : "Antrean verifikasi tidak dapat dimuat."
      );
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  async function changePage(type: VerificationTab, page: number) {
    setIsLoading(true);
    setLoadingError("");
    try {
      const result = await getPendingVerifications(token, type, page);
      if (type === "provitas") {
        setProvitasPage(result);
        setProvitas(result.data);
      } else {
        setLuasArealPage(result);
        setLuasAreal(result.data);
      }
    } catch (error: unknown) {
      setLoadingError(
        error instanceof Error
          ? error.message
          : "Halaman antrean tidak dapat dimuat."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSubmissions();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadSubmissions]);

  async function handleApprove(type: SubmissionType, id: string) {
    setActionError("");
    setActionMessage("");
    setActiveAction(`approve-${id}`);

    try {
      await reviewSubmission(token, type, id, "setujui");
      setActionMessage("Pengajuan berhasil disetujui dan diverifikasi.");
      await loadSubmissions();
    } catch (error: unknown) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Persetujuan gagal diproses."
      );
    } finally {
      setActiveAction("");
    }
  }

  function openRejectModal(type: SubmissionType, id: string, label: string) {
    setRejectItem({ id, type, label });
    setRejectReason("");
  }

  async function handleConfirmReject() {
    if (!rejectItem) return;
    if (!rejectReason.trim()) {
      setActionError("Alasan penolakan wajib diisi untuk menolak pengajuan.");
      return;
    }

    const { type, id } = rejectItem;
    setActionError("");
    setActionMessage("");
    setActiveAction(`reject-${id}`);

    try {
      await reviewSubmission(token, type, id, "tolak", rejectReason.trim());
      setActionMessage("Pengajuan telah ditolak dan dikembalikan ke penyuluh.");
      setRejectItem(null);
      setRejectReason("");
      await loadSubmissions();
    } catch (error: unknown) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Penolakan gagal diproses."
      );
    } finally {
      setActiveAction("");
    }
  }

  const activeRecords = tab === "provitas" ? provitas : luasAreal;
  const activePage = tab === "provitas" ? provitasPage : luasArealPage;

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="size-5 text-primary" />
              <CardTitle className="text-xl font-bold">Antrean Verifikasi Admin</CardTitle>
            </div>
            <CardDescription className="mt-1">
              Validasi dan setujui laporan pengajuan provitas dan luas areal dari penyuluh pertanian.
            </CardDescription>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadSubmissions()}
            disabled={isLoading}
            className="gap-2 self-start sm:self-auto"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Muat Ulang</span>
          </Button>
        </div>

        <div className="pt-4">
          <Tabs
            value={tab}
            onValueChange={(val) => setTab(val as VerificationTab)}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid grid-cols-2 w-full sm:w-80">
              <TabsTrigger value="provitas" className="gap-2 font-semibold">
                <Sprout className="size-4" />
                <span>Provitas ({provitasPage?.total ?? 0})</span>
              </TabsTrigger>
              <TabsTrigger value="luas-areal" className="gap-2 font-semibold">
                <Layers className="size-4" />
                <span>Luas Areal ({luasArealPage?.total ?? 0})</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {actionMessage && (
          <Alert variant="success">
            <CheckCircle2 className="size-4" />
            <AlertDescription>{actionMessage}</AlertDescription>
          </Alert>
        )}

        {actionError && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        )}

        {loadingError && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertDescription>{loadingError}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Memuat antrean verifikasi...</p>
          </div>
        ) : activeRecords.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center bg-card/40">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <CheckCircle2 className="size-6 text-primary" />
            </div>
            <p className="mt-3 text-base font-bold text-foreground">
              Tidak ada antrean tertunda
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Semua pengajuan {tab === "provitas" ? "provitas" : "luas areal"} telah diverifikasi.
            </p>
          </div>
        ) : tab === "provitas" ? (
          /* Table for Provitas Submissions */
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Penyuluh & Lokasi</TableHead>
                  <TableHead>Tgl Panen</TableHead>
                  <TableHead className="text-right">Luas Petak</TableHead>
                  <TableHead className="text-right">Berat Gabah</TableHead>
                  <TableHead className="text-right">Provitas</TableHead>
                  <TableHead>Kadar Air</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {provitas.map((record) => {
                  const isProcessing =
                    activeAction === `approve-${record.id}` ||
                    activeAction === `reject-${record.id}`;

                  return (
                    <TableRow key={record.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                            <User className="size-3.5 text-muted-foreground" />
                            {record.ppl?.nama ?? "Penyuluh"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {record.desa?.nama ?? "Desa"} · {record.lahan?.nama_petani ?? "Petani"} ({record.lahan?.kode_sampel})
                          </p>
                          {record.catatan && (
                            <p className="text-xs text-muted-foreground italic mt-1 bg-muted/40 p-1.5 rounded">
                              &ldquo;{record.catatan}&rdquo;
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap font-medium">
                        {record.tanggal_panen}
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono">
                        {record.luas_petak_m2} m²
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono font-medium">
                        {record.berat_gabah_kg} kg
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="font-bold text-primary font-mono">
                          {record.provitas_kuha} Ku/Ha
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {record.kadar_air ? `${record.kadar_air}%` : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={isProcessing}
                            onClick={() =>
                              openRejectModal(
                                "provitas",
                                record.id,
                                `Panen ${record.tanggal_panen} (${record.desa?.nama ?? "Desa"})`
                              )
                            }
                            className="h-8 px-2.5 text-xs font-semibold"
                          >
                            Tolak
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            disabled={isProcessing}
                            onClick={() => void handleApprove("provitas", record.id)}
                            className="h-8 px-3 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white"
                          >
                            {isProcessing ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              "Setujui"
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          /* Table for Luas Areal Submissions */
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Penyuluh & Desa</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead className="text-right">Luas Tanam</TableHead>
                  <TableHead className="text-right">Luas Panen</TableHead>
                  <TableHead className="text-right">Luas Puso</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {luasAreal.map((record) => {
                  const isProcessing =
                    activeAction === `approve-${record.id}` ||
                    activeAction === `reject-${record.id}`;

                  return (
                    <TableRow key={record.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                            <User className="size-3.5 text-muted-foreground" />
                            {record.ppl?.nama ?? "Penyuluh"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {record.desa?.nama ?? "Desa"}{record.desa?.kecamatan?.nama ? ` · Kec. ${record.desa.kecamatan.nama}` : ""}
                          </p>
                          {record.catatan && (
                            <p className="text-xs text-muted-foreground italic mt-1 bg-muted/40 p-1.5 rounded">
                              &ldquo;{record.catatan}&rdquo;
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap font-medium">
                        {months[(record.bulan ?? 1) - 1]} {record.tahun}
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono">
                        {record.luas_tanam_ha ?? 0} ha
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono font-medium text-emerald-800">
                        {record.luas_panen_ha ?? 0} ha
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono text-destructive">
                        {record.luas_puso_ha ?? 0} ha
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={isProcessing}
                            onClick={() =>
                              openRejectModal(
                                "luas-areal",
                                record.id,
                                `Luas Areal ${record.desa?.nama ?? "Desa"} - ${months[(record.bulan ?? 1) - 1]} ${record.tahun}`
                              )
                            }
                            className="h-8 px-2.5 text-xs font-semibold"
                          >
                            Tolak
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            disabled={isProcessing}
                            onClick={() => void handleApprove("luas-areal", record.id)}
                            className="h-8 px-3 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white"
                          >
                            {isProcessing ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              "Setujui"
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination Controls */}
        {activePage && activePage.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
            <p>
              Menampilkan halaman <strong>{activePage.current_page}</strong> dari{" "}
              <strong>{activePage.last_page}</strong> (total {activePage.total} data)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={activePage.current_page <= 1 || isLoading}
                onClick={() => void changePage(tab, activePage.current_page - 1)}
                className="gap-1 text-xs"
              >
                <ChevronLeft className="size-3.5" />
                <span>Sebelumnya</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={activePage.current_page >= activePage.last_page || isLoading}
                onClick={() => void changePage(tab, activePage.current_page + 1)}
                className="gap-1 text-xs"
              >
                <span>Berikutnya</span>
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Reject Modal Dialog */}
      <Dialog open={!!rejectItem} onOpenChange={(open) => !open && setRejectItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="size-5 text-destructive" />
              <span>Tolak Pengajuan Laporan</span>
            </DialogTitle>
            <DialogDescription>
              Tuliskan alasan penolakan untuk pengajuan:{" "}
              <strong className="text-foreground">{rejectItem?.label}</strong>.
              Alasan ini akan dikirimkan kepada penyuluh lapangan untuk dilakukan perbaikan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <label htmlFor="rejection_reason" className="text-xs font-semibold text-foreground">
              Catatan Alasan Penolakan <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="rejection_reason"
              rows={4}
              placeholder="Contoh: Luas petak tidak sesuai dengan data sampel SK bupati, mohon konfirmasi ulang ukuran petak..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectItem(null)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleConfirmReject()}
              disabled={!rejectReason.trim()}
              className="gap-2"
            >
              <XCircle className="size-4" />
              <span>Konfirmasi Tolak</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
