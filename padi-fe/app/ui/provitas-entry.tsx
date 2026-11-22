"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Calculator,
  CheckCircle2,
  ChevronRight,
  Info,
  MapPin,
  Save,
  Sparkles,
  Sprout,
} from "lucide-react";
import {
  ReferenceDesa,
  ReferenceKecamatan,
  ReferenceLahan,
  ReferenceMusimTanam,
  SyncRecord,
} from "@/app/lib/auth";
import { LocalProvitas } from "@/app/lib/offline-store";
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

type ProvitasEntryProps = {
  kecamatan: ReferenceKecamatan[];
  desa: ReferenceDesa[];
  lahan: ReferenceLahan[];
  musimTanam: ReferenceMusimTanam[];
  records: SyncRecord[];
  onSave: (record: LocalProvitas) => Promise<void>;
  isOnline: boolean;
  editRecord: SyncRecord | null;
  initialLahanId?: string;
  onCancelEdit: () => void;
};

function numericValue(value: string) {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function ProvitasEntry({
  kecamatan,
  desa,
  lahan,
  musimTanam,
  records,
  onSave,
  isOnline,
  editRecord,
  initialLahanId: preselectedLahanId = "",
  onCancelEdit,
}: ProvitasEntryProps) {
  const initialLahanId = editRecord?.lahan_id ?? preselectedLahanId;
  const initialDesaId =
    lahan.find((item) => item.id === initialLahanId)?.desa_id ?? "";
  const initialKecamatanId =
    desa.find((item) => item.id === initialDesaId)?.kecamatan_id ?? "";
  const [kecamatanId, setKecamatanId] = useState(initialKecamatanId);
  const [desaId, setDesaId] = useState(initialDesaId);
  const [lahanId, setLahanId] = useState(initialLahanId);
  const [musimTanamId, setMusimTanamId] = useState(
    editRecord?.musim_tanam_id ?? "",
  );
  const [tanggalPanen, setTanggalPanen] = useState(
    editRecord?.tanggal_panen?.slice(0, 10) ?? "",
  );
  const [luasPetak, setLuasPetak] = useState(
    editRecord ? String(editRecord.luas_petak_m2 ?? "") : "6.25",
  );
  const [beratGabah, setBeratGabah] = useState(
    editRecord?.berat_gabah_kg == null
      ? ""
      : String(editRecord.berat_gabah_kg),
  );
  const [kadarAir, setKadarAir] = useState(
    editRecord?.kadar_air == null ? "" : String(editRecord.kadar_air),
  );
  const [catatan, setCatatan] = useState(editRecord?.catatan ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const formCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editRecord) {
      formCardRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [editRecord]);

  const filteredDesa = useMemo(
    () => desa.filter((item) => item.kecamatan_id === kecamatanId),
    [desa, kecamatanId]
  );
  const filteredLahan = useMemo(
    () => lahan.filter((item) => item.desa_id === desaId),
    [desaId, lahan]
  );
  const luasPetakNumber = numericValue(luasPetak);
  const beratGabahNumber = numericValue(beratGabah);
  const provitasPreview =
    luasPetakNumber && beratGabahNumber !== null && luasPetakNumber > 0
      ? (beratGabahNumber / luasPetakNumber) * 100
      : null;

  async function saveRecord(form: HTMLFormElement) {
    if (!form.reportValidity()) return;
    setError("");
    setSuccess("");

    if (!kecamatanId || !desaId || !lahanId || !musimTanamId) {
      setError("Pilih kecamatan, desa, lahan, dan musim tanam.");
      return;
    }

    if (!tanggalPanen || luasPetakNumber === null || beratGabahNumber === null) {
      setError("Lengkapi tanggal panen, luas petak, dan berat gabah.");
      return;
    }

    if (luasPetakNumber <= 0) {
      setError("Luas petak harus lebih besar dari 0 m².");
      return;
    }

    if (
      luasPetakNumber > 999999.99 ||
      beratGabahNumber < 0 ||
      beratGabahNumber > 999999.99
    ) {
      setError(
        "Luas petak atau berat gabah berada di luar batas yang didukung."
      );
      return;
    }

    if (kadarAir !== "") {
      const moisture = numericValue(kadarAir);
      if (moisture === null || moisture < 0 || moisture > 100) {
        setError("Kadar air harus berupa angka antara 0 dan 100 persen.");
        return;
      }
    }

    const alreadyRecorded = records.some(
      (record) =>
        !record.deleted &&
        record.id !== editRecord?.id &&
        record.lahan_id === lahanId &&
        record.musim_tanam_id === musimTanamId,
    );
    if (alreadyRecorded) {
      setError(
        "Lahan ini sudah memiliki catatan provitas untuk musim tanam tersebut.",
      );
      return;
    }

    setIsSaving(true);

    try {
      const record: LocalProvitas = {
        id: editRecord?.id ?? crypto.randomUUID(),
        lahan_id: lahanId,
        musim_tanam_id: musimTanamId,
        tanggal_panen: tanggalPanen,
        luas_petak_m2: luasPetakNumber,
        berat_gabah_kg: beratGabahNumber,
        kadar_air: kadarAir === "" ? null : numericValue(kadarAir),
        catatan: catatan.trim() || null,
        provitas_kuha: Number((provitasPreview ?? 0).toFixed(2)),
        updated_at: new Date().toISOString(),
        synced_at: null,
        deleted: false,
        sync_error: null,
      };

      await onSave(record);

      setSuccess(
        isOnline
          ? "Catatan provitas berhasil disimpan."
          : "Catatan provitas tersimpan offline. Akan disinkronkan saat online."
      );

      // Reset form
      setKecamatanId("");
      setDesaId("");
      setLahanId("");
      setMusimTanamId("");
      setTanggalPanen("");
      setLuasPetak("6.25");
      setBeratGabah("");
      setKadarAir("");
      setCatatan("");
    } catch (saveError: unknown) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Catatan provitas belum dapat disimpan."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-3">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancelEdit}
          className="-ml-2 text-muted-foreground"
        >
          Data Provitas
        </Button>
        <ChevronRight className="size-4 text-muted-foreground" />
        <span className="font-medium text-foreground">Formulir</span>
      </nav>
      <Card
        ref={formCardRef}
        className="scroll-mt-24 shadow-md"
      >
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
              <Sprout className="size-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">
                {editRecord ? "Mengedit Catatan Provitas" : "Catat Data Provitas Baru"}
              </CardTitle>
              <CardDescription>
                {editRecord
                  ? "Perbarui informasi catatan yang dipilih, lalu simpan perubahan."
                  : "Input data ubinan panen lapangan untuk perhitungan produktivitas padi."}
              </CardDescription>
            </div>
          </div>
          <Badge
            variant={isOnline ? "success" : "warning"}
            className="w-fit"
          >
            {isOnline ? "Mode Online" : "Mode Offline"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {editRecord && (
          <Alert variant="info" role="note" className="mb-6">
            <Info className="size-4" />
            <AlertTitle>Mode edit aktif</AlertTitle>
            <AlertDescription>
              Periksa dan ubah data yang diperlukan, lalu pilih{" "}
              <strong>Simpan Perubahan</strong>. Pilih{" "}
              <strong>Batalkan Edit</strong> untuk kembali tanpa menyimpan.
            </AlertDescription>
          </Alert>
        )}

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
          id="provitas-form"
          onSubmit={(e) => {
            e.preventDefault();
            void saveRecord(e.currentTarget);
          }}
          className="space-y-6"
        >
          {/* Section: Wilayah dan Lahan */}
          <div className="rounded-2xl border border-border bg-muted/20 p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <MapPin className="size-4 text-primary" />
              <span>Wilayah & Penugasan Lahan</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {initialLahanId ? (
                <div className="space-y-2 sm:col-span-2">
                  <Label>Lahan yang dipilih</Label>
                  <div className="flex min-h-11 items-center rounded-xl border border-input bg-muted/40 px-3 text-sm text-foreground">
                    {kecamatan.find((item) => item.id === kecamatanId)?.nama} ·{" "}
                    {desa.find((item) => item.id === desaId)?.nama} ·{" "}
                    {lahan.find((item) => item.id === lahanId)?.kode_sampel} —{" "}
                    {lahan.find((item) => item.id === lahanId)?.nama_petani}
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="kecamatan">Kecamatan</Label>
                    <select
                      id="kecamatan"
                      value={kecamatanId}
                      onChange={(e) => {
                        setKecamatanId(e.target.value);
                        setDesaId("");
                        setLahanId("");
                      }}
                      required
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Pilih kecamatan tugas...</option>
                      {kecamatan.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nama} ({item.kode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="desa">Desa</Label>
                    <select
                      id="desa"
                      value={desaId}
                      onChange={(e) => {
                        setDesaId(e.target.value);
                        setLahanId("");
                      }}
                      disabled={!kecamatanId}
                      required
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    >
                      <option value="">
                        {kecamatanId ? "Pilih desa binaan..." : "Pilih kecamatan terlebih dahulu"}
                      </option>
                      {filteredDesa.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nama} ({item.kode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lahan">Petak Lahan & Petani</Label>
                    <select
                      id="lahan"
                      value={lahanId}
                      onChange={(e) => setLahanId(e.target.value)}
                      disabled={!desaId}
                      required
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    >
                      <option value="">
                        {desaId ? "Pilih sampel lahan petani..." : "Pilih desa terlebih dahulu"}
                      </option>
                      {filteredLahan.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nama_petani} — Sampel {item.kode_sampel} ({item.luas_lahan_ha} ha)
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="musim">Musim Tanam</Label>
                <select
                  id="musim"
                  value={musimTanamId}
                  onChange={(e) => setMusimTanamId(e.target.value)}
                  required
                  className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Pilih musim tanam...</option>
                  {musimTanam.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nama} ({item.tanggal_mulai} s/d {item.tanggal_selesai})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section: Parameter Ubinan */}
          <div className="space-y-5 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
            <div className="flex items-center gap-2.5 text-sm font-bold text-foreground">
              <span className="flex size-9 items-center justify-center rounded-xl bg-secondary">
                <Calculator className="size-4 text-primary" />
              </span>
              <span>Pengukuran Ubinan Lapangan</span>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tanggal_panen">Tanggal Panen / Ubinan</Label>
                <Input
                  id="tanggal_panen"
                  type="date"
                  required
                  value={tanggalPanen}
                  onChange={(e) => setTanggalPanen(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="luas_petak">Luas Petak (m²)</Label>
                <Input
                  id="luas_petak"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="999999.99"
                  required
                  placeholder="Contoh: 6.25"
                  value={luasPetak}
                  onChange={(e) => setLuasPetak(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Nilai awal 6,25 m²; sesuaikan dengan ukuran petak.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="berat_gabah">Berat Gabah Ubinan (kg)</Label>
                <Input
                  id="berat_gabah"
                  type="number"
                  step="0.01"
                  min="0"
                  max="999999.99"
                  required
                  placeholder="Contoh: 4.8"
                  value={beratGabah}
                  onChange={(e) => setBeratGabah(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="kadar_air">
                  Kadar Air (%)
                  <span className="text-muted-foreground font-normal ml-1">(opsional)</span>
                </Label>
                <Input
                  id="kadar_air"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="Contoh: 14"
                  value={kadarAir}
                  onChange={(e) => setKadarAir(e.target.value)}
                />
              </div>
            </div>

            {/* Live Calculation Preview Card */}
            <div className="rounded-xl border border-primary/20 bg-secondary/50 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                    <Sparkles className="size-3.5" />
                    <span>Estimasi Produktivitas (Provitas)</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Rumus: <code className="font-mono bg-background px-1.5 py-0.5 rounded text-foreground">(Berat Gabah kg / Luas Petak m²) × 100</code>
                  </p>
                </div>
                <div className="text-right">
                  {provitasPreview !== null ? (
                    <div className="flex items-baseline gap-1.5 justify-end">
                      <span className="text-3xl font-extrabold text-primary">
                        {provitasPreview.toFixed(2)}
                      </span>
                      <span className="text-sm font-bold text-foreground">Ku/Ha</span>
                    </div>
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground italic">
                      Masukkan luas petak dan berat gabah
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Catatan Tambahan */}
          <div className="space-y-2">
            <Label htmlFor="catatan">
              Catatan Pengamatan Lapangan
              <span className="text-muted-foreground font-normal ml-1">(opsional)</span>
            </Label>
            <Textarea
              id="catatan"
              rows={3}
              placeholder="Kondisi cuaca, varietas padi, serangan OPT, atau keterangan tambahan lainnya..."
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
            />
          </div>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-border pt-6">
        <p className="text-xs text-muted-foreground">
          {isOnline
            ? "Data akan langsung tersimpan saat dikirim."
            : "Data yang disimpan saat offline tersimpan aman di database lokal browser."}
        </p>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={onCancelEdit}
            className="flex-1 sm:flex-none"
          >
            {editRecord ? "Batalkan Edit" : "Batal"}
          </Button>
          <Button
            type="submit"
            form="provitas-form"
            disabled={isSaving}
            className="flex-1 sm:flex-none gap-2 font-semibold shadow-xs"
          >
            <Save className="size-4" />
            <span>
              {isSaving
                ? "Menyimpan..."
                : editRecord
                  ? "Simpan Perubahan"
                  : "Simpan Provitas"}
            </span>
          </Button>
        </div>
      </CardFooter>
      </Card>
    </div>
  );
}
