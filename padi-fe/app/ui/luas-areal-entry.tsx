"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  FileText,
  MapPin,
  Save,
} from "lucide-react";
import { ReferenceDesa, SyncRecord } from "@/app/lib/auth";
import { LocalLuasAreal } from "@/app/lib/offline-store";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  editRecord?: SyncRecord | null;
  initialDesaId?: string;
  onCancelEdit?: () => void;
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
const maxArea = 99999999.99;

type AreaField = "luasTanam" | "luasPanen" | "luasPuso";

function numberOrNull(value: string) {
  if (value.trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function areaFieldError(value: string, required: boolean): string | null {
  if (value.trim() === "") {
    return required ? "Kolom ini wajib diisi." : null;
  }

  const number = numberOrNull(value);
  if (number === null) return "Masukkan nilai berupa angka.";
  if (number < 0) return "Luas areal tidak boleh bernilai negatif.";
  if (number > maxArea) return "Nilai melebihi batas maksimum.";

  return null;
}

export default function LuasArealEntry({
  desa,
  records,
  isOnline,
  onSave,
  editRecord = null,
  initialDesaId = "",
  onCancelEdit,
}: LuasArealEntryProps) {
  const now = new Date();
  const [desaId, setDesaId] = useState(editRecord?.desa_id ?? initialDesaId);
  const [bulan, setBulan] = useState(editRecord ? Number(editRecord.bulan) : now.getMonth() + 1);
  const [tahun, setTahun] = useState(editRecord ? Number(editRecord.tahun) : now.getFullYear());
  const [editedForm, setEditedForm] = useState<{
    key: string;
    values: {
      luasTanam: string;
      luasPanen: string;
      luasPuso: string;
      catatan: string;
    };
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [touchedFields, setTouchedFields] = useState<
    Record<AreaField, boolean>
  >({ luasTanam: false, luasPanen: false, luasPuso: false });

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
  };
  const formValues =
    editedForm?.key === formKey ? editedForm.values : initialValues;
  const numericFieldErrors: Record<AreaField, string | null> = {
    luasTanam: areaFieldError(formValues.luasTanam, true),
    luasPanen: areaFieldError(formValues.luasPanen, true),
    luasPuso: areaFieldError(formValues.luasPuso, false),
  };

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouchedFields({ luasTanam: true, luasPanen: true, luasPuso: true });
    setError("");
    setSuccess("");

    if (!desaId) {
      setError("Pilih desa terlebih dahulu.");
      return;
    }

    const luasTanam = numberOrNull(formValues.luasTanam);
    const luasPanen = numberOrNull(formValues.luasPanen);
    const luasPuso = numberOrNull(formValues.luasPuso);

    if (luasTanam === null || luasPanen === null) {
      setError("Luas tanam dan luas panen wajib diisi.");
      return;
    }

    if (Object.values(numericFieldErrors).some(Boolean)) {
      setError("Periksa kembali nilai luas areal yang dimasukkan.");
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
        updated_at: new Date().toISOString(),
        synced_at: null,
        deleted: false,
        sync_error: null,
      };

      await onSave(record);
      setSuccess(
        isOnline
          ? "Laporan luas areal berhasil disimpan."
          : "Laporan luas areal tersimpan offline. Akan disinkronkan saat online."
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
    <div className="mx-auto w-full max-w-4xl space-y-3">
      <Card className="shadow-md">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
              <FileText className="size-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">
                {editRecord ? "Mengedit Laporan Luas Areal" : "Laporan Luas Areal Padi"}
              </CardTitle>
              <CardDescription>
                Pencatatan rekapitulasi luas tanam, luas panen, dan puso bulanan.
              </CardDescription>
            </div>
          </div>
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

        <form
          id="luas-areal-form"
          onSubmit={(e) => void handleSubmit(e)}
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
                {initialDesaId ? (
                  <div
                    id="desa_select"
                    className="flex h-11 items-center rounded-xl border border-input bg-muted/40 px-3 text-sm text-foreground"
                  >
                    {desa.find((item) => item.id === desaId)?.nama ?? "Desa terpilih"}
                  </div>
                ) : (
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
                )}
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
                  type="text"
                  inputMode="decimal"
                  required
                  aria-invalid={touchedFields.luasTanam && !!numericFieldErrors.luasTanam}
                  aria-describedby={touchedFields.luasTanam && numericFieldErrors.luasTanam ? "luas-tanam-error" : undefined}
                  placeholder="0.00"
                  value={formValues.luasTanam}
                  onChange={(e) => {
                    setError("");
                    updateForm("luasTanam", e.target.value);
                    setTouchedFields((fields) => ({ ...fields, luasTanam: true }));
                  }}
                />
                {touchedFields.luasTanam && numericFieldErrors.luasTanam && (
                  <p id="luas-tanam-error" className="text-sm text-destructive">
                    {numericFieldErrors.luasTanam}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="luas_panen">Luas Panen (Ha)</Label>
                <Input
                  id="luas_panen"
                  type="text"
                  inputMode="decimal"
                  required
                  aria-invalid={touchedFields.luasPanen && !!numericFieldErrors.luasPanen}
                  aria-describedby={touchedFields.luasPanen && numericFieldErrors.luasPanen ? "luas-panen-error" : undefined}
                  placeholder="0.00"
                  value={formValues.luasPanen}
                  onChange={(e) => {
                    setError("");
                    updateForm("luasPanen", e.target.value);
                    setTouchedFields((fields) => ({ ...fields, luasPanen: true }));
                  }}
                />
                {touchedFields.luasPanen && numericFieldErrors.luasPanen && (
                  <p id="luas-panen-error" className="text-sm text-destructive">
                    {numericFieldErrors.luasPanen}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="luas_puso">
                  Luas Puso / Gagal Panen (Ha)
                  <span className="text-muted-foreground font-normal ml-1">(opsional)</span>
                </Label>
                <Input
                  id="luas_puso"
                  type="text"
                  inputMode="decimal"
                  aria-invalid={touchedFields.luasPuso && !!numericFieldErrors.luasPuso}
                  aria-describedby={touchedFields.luasPuso && numericFieldErrors.luasPuso ? "luas-puso-error" : undefined}
                  placeholder="0.00"
                  value={formValues.luasPuso}
                  onChange={(e) => {
                    setError("");
                    updateForm("luasPuso", e.target.value);
                    setTouchedFields((fields) => ({ ...fields, luasPuso: true }));
                  }}
                />
                {touchedFields.luasPuso && numericFieldErrors.luasPuso && (
                  <p id="luas-puso-error" className="text-sm text-destructive">
                    {numericFieldErrors.luasPuso}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Catatan */}
          <div className="space-y-2">
            <Label htmlFor="catatan_areal">Catatan Tambahan (opsional)</Label>
            <Textarea
              id="catatan_areal"
              rows={3}
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
            ? "Laporan untuk periode ini sudah ada dan dapat diperbarui."
            : "Data akan langsung tersimpan dan bisa diperbarui kapan saja."}
        </p>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {onCancelEdit && (
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={onCancelEdit}
              className="flex-1 sm:flex-none"
            >
              {editRecord ? "Batalkan Edit" : "Batal"}
            </Button>
          )}
          <Button
            type="submit"
            form="luas-areal-form"
            disabled={isSaving}
            className="flex-1 sm:flex-none gap-2 font-semibold shadow-xs"
          >
            <Save className="size-4" />
            <span>{isSaving ? "Menyimpan..." : "Simpan Laporan"}</span>
          </Button>
        </div>
      </CardFooter>
      </Card>
    </div>
  );
}
