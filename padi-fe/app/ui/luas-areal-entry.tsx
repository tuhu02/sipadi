"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  FileText,
  Lock,
  MapPin,
  Save,
  Send,
} from "lucide-react";
import { ReferenceDesa, SyncRecord } from "@/app/lib/auth";
import { LocalLuasAreal } from "@/app/lib/offline-store";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type LuasArealEntryProps = {
  desa: ReferenceDesa[];
  records: SyncRecord[];
  isOnline: boolean;
  onSave: (record: LocalLuasAreal) => Promise<void>;
};

const monthNames = [
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

function numberOrNull(value: string) {
  if (value.trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export default function LuasArealEntry({
  desa,
  records,
  isOnline,
  onSave,
}: LuasArealEntryProps) {
  const now = new Date();
  const [desaId, setDesaId] = useState("");
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const [editedForm, setEditedForm] = useState<{
    key: string;
    values: {
      luasTanam: string;
      luasPanen: string;
      luasPuso: string;
      catatan: string;
      status: "draft" | "submitted";
    };
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const existingRecord = useMemo(
    () =>
      records.find(
        (record) =>
          record.desa_id === desaId &&
          Number(record.bulan) === bulan &&
          Number(record.tahun) === tahun
      ),
    [bulan, desaId, records, tahun]
  );

  const formKey = `${desaId}:${tahun}:${bulan}`;
  const initialValues = {
    luasTanam: existingRecord ? String(existingRecord.luas_tanam_ha ?? "") : "",
    luasPanen: existingRecord ? String(existingRecord.luas_panen_ha ?? "") : "",
    luasPuso:
      existingRecord?.luas_puso_ha == null
        ? ""
        : String(existingRecord.luas_puso_ha),
    catatan: existingRecord?.catatan ?? "",
    status: (existingRecord?.status === "draft"
      ? "draft"
      : "submitted") as "draft" | "submitted",
  };
  const formValues =
    editedForm?.key === formKey ? editedForm.values : initialValues;

  function updateForm<K extends keyof typeof initialValues>(
    field: K,
    value: (typeof initialValues)[K]
  ) {
    setEditedForm((previous) => ({
      key: formKey,
      values: {
        ...(previous?.key === formKey ? previous.values : initialValues),
        [field]: value,
      },
    }));
  }

  const isVerified = existingRecord?.status === "verified";

  async function handleSubmit(event: FormEvent<HTMLFormElement>, status: "draft" | "submitted") {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!desaId) {
      setError("Pilih desa terlebih dahulu.");
      return;
    }

    if (isVerified) {
      setError("Laporan yang sudah diverifikasi tidak dapat diubah.");
      return;
    }

    const luasTanam = numberOrNull(formValues.luasTanam);
    const luasPanen = numberOrNull(formValues.luasPanen);
    const luasPuso = numberOrNull(formValues.luasPuso);

    if (luasTanam === null || luasPanen === null) {
      setError("Luas tanam dan luas panen wajib diisi.");
      return;
    }

    if (luasTanam < 0 || luasPanen < 0 || (luasPuso !== null && luasPuso < 0)) {
      setError("Luas areal tidak boleh bernilai negatif.");
      return;
    }

    setIsSaving(true);

    try {
      const record: LocalLuasAreal = {
        id: existingRecord?.id ?? crypto.randomUUID(),
        desa_id: desaId,
        tahun,
        bulan,
        luas_tanam_ha: luasTanam,
        luas_panen_ha: luasPanen,
        luas_puso_ha: luasPuso,
        catatan: formValues.catatan.trim() || null,
        status,
        updated_at: new Date().toISOString(),
        synced_at: null,
        deleted: false,
        sync_error: null,
      };

      await onSave(record);
      setSuccess(
        status === "draft"
          ? "Laporan luas areal disimpan sebagai draft di perangkat ini."
          : isOnline
            ? "Laporan luas areal diajukan untuk verifikasi admin."
            : "Laporan luas areal disimpan offline. Akan dikirim otomatis saat online."
      );
    } catch (saveError: unknown) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Laporan luas areal belum dapat disimpan."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
              <FileText className="size-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Laporan Luas Areal Padi</CardTitle>
              <CardDescription>
                Pencatatan rekapitulasi luas tanam, luas panen, dan puso bulanan.
              </CardDescription>
            </div>
          </div>
          <Badge variant={isOnline ? "success" : "warning"} className="w-fit">
            {isOnline ? "Mode Online" : "Mode Offline"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="success" className="mb-6">
            <CheckCircle2 className="size-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {isVerified && (
          <Alert variant="info" className="mb-6">
            <Lock className="size-4" />
            <div>
              <AlertTitle className="text-sm font-semibold">Laporan Telah Terverifikasi</AlertTitle>
              <AlertDescription className="text-xs">
                Laporan untuk periode {monthNames[bulan - 1]} {tahun} telah diverifikasi oleh administrator dan terkunci dari perubahan.
              </AlertDescription>
            </div>
          </Alert>
        )}

        <form
          id="luas-areal-form"
          onSubmit={(e) => void handleSubmit(e, "submitted")}
          className="space-y-6"
        >
          {/* Section: Filter Lokasi & Periode */}
          <div className="rounded-2xl border border-border bg-muted/20 p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Calendar className="size-4 text-primary" />
              <span>Wilayah & Periode Laporan</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="desa_select">Desa Penugasan</Label>
                <select
                  id="desa_select"
                  value={desaId}
                  onChange={(e) => setDesaId(e.target.value)}
                  required
                  className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Pilih desa...</option>
                  {desa.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nama} ({item.kode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulan_select">Bulan</Label>
                <select
                  id="bulan_select"
                  value={bulan}
                  onChange={(e) => setBulan(Number(e.target.value))}
                  className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {monthNames.map((name, index) => (
                    <option key={name} value={index + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tahun_select">Tahun</Label>
                <select
                  id="tahun_select"
                  value={tahun}
                  onChange={(e) => setTahun(Number(e.target.value))}
                  className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map(
                    (y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Section: Luas Angka */}
          <div className="rounded-2xl border border-border bg-muted/20 p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <MapPin className="size-4 text-primary" />
              <span>Rincian Luas Areal (Hektare)</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="luas_tanam">Luas Tanam (Ha)</Label>
                <Input
                  id="luas_tanam"
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={isVerified}
                  required
                  placeholder="0.00"
                  value={formValues.luasTanam}
                  onChange={(e) => updateForm("luasTanam", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="luas_panen">Luas Panen (Ha)</Label>
                <Input
                  id="luas_panen"
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={isVerified}
                  required
                  placeholder="0.00"
                  value={formValues.luasPanen}
                  onChange={(e) => updateForm("luasPanen", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="luas_puso">
                  Luas Puso / Gagal Panen (Ha)
                  <span className="text-muted-foreground font-normal ml-1">(opsional)</span>
                </Label>
                <Input
                  id="luas_puso"
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={isVerified}
                  placeholder="0.00"
                  value={formValues.luasPuso}
                  onChange={(e) => updateForm("luasPuso", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section: Catatan */}
          <div className="space-y-2">
            <Label htmlFor="catatan_areal">Catatan Tambahan (opsional)</Label>
            <Textarea
              id="catatan_areal"
              rows={3}
              disabled={isVerified}
              placeholder="Faktor cuaca, banjir, kekeringan, serangan hama, atau keterangan lainnya..."
              value={formValues.catatan}
              onChange={(e) => updateForm("catatan", e.target.value)}
            />
          </div>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-border pt-6">
        <p className="text-xs text-muted-foreground">
          {existingRecord
            ? `Status data saat ini: ${existingRecord.status}`
            : "Data baru belum pernah disimpan untuk periode ini."}
        </p>

        {!isVerified && (
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={(e) => {
                const form = (e.currentTarget.closest(".shadow-md")?.querySelector("#luas-areal-form") as HTMLFormElement) ?? null;
                if (form) {
                  const syntheticEvent = {
                    preventDefault: () => {},
                  } as FormEvent<HTMLFormElement>;
                  void handleSubmit(syntheticEvent, "draft");
                }
              }}
              className="flex-1 sm:flex-none gap-2"
            >
              <Save className="size-4" />
              <span>Simpan Draft</span>
            </Button>

            <Button
              type="submit"
              form="luas-areal-form"
              disabled={isSaving}
              className="flex-1 sm:flex-none gap-2 font-semibold shadow-xs"
            >
              <Send className="size-4" />
              <span>{isSaving ? "Menyimpan..." : "Kirim Pengajuan"}</span>
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
