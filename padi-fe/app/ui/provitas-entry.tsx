"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Calculator,
  CheckCircle2,
  MapPin,
  Save,
  Send,
  Sparkles,
  Sprout,
} from "lucide-react";
import {
  ReferenceDesa,
  ReferenceKecamatan,
  ReferenceLahan,
  ReferenceMusimTanam,
} from "@/app/lib/auth";
import { LocalProvitas } from "@/app/lib/offline-store";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  onSave: (record: LocalProvitas) => Promise<void>;
  isOnline: boolean;
};

type SaveStatus = "draft" | "submitted";

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
  onSave,
  isOnline,
}: ProvitasEntryProps) {
  const [kecamatanId, setKecamatanId] = useState("");
  const [desaId, setDesaId] = useState("");
  const [lahanId, setLahanId] = useState("");
  const [musimTanamId, setMusimTanamId] = useState("");
  const [tanggalPanen, setTanggalPanen] = useState("");
  const [luasPetak, setLuasPetak] = useState("");
  const [beratGabah, setBeratGabah] = useState("");
  const [kadarAir, setKadarAir] = useState("");
  const [catatan, setCatatan] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  async function saveRecord(status: SaveStatus, form: HTMLFormElement) {
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

    setIsSaving(true);

    try {
      const record: LocalProvitas = {
        id: crypto.randomUUID(),
        lahan_id: lahanId,
        musim_tanam_id: musimTanamId,
        tanggal_panen: tanggalPanen,
        luas_petak_m2: luasPetakNumber,
        berat_gabah_kg: beratGabahNumber,
        kadar_air: kadarAir === "" ? null : numericValue(kadarAir),
        catatan: catatan.trim() || null,
        provitas_kuha: Number((provitasPreview ?? 0).toFixed(2)),
        status,
        updated_at: new Date().toISOString(),
        synced_at: null,
        deleted: false,
        sync_error: null,
      };

      await onSave(record);

      setSuccess(
        status === "draft"
          ? "Catatan provitas tersimpan sebagai draft di perangkat ini."
          : isOnline
            ? "Catatan provitas tersimpan dan akan segera diverifikasi oleh admin."
            : "Catatan provitas tersimpan di perangkat offline. Akan otomatis disinkronkan saat online."
      );

      // Reset form
      setKecamatanId("");
      setDesaId("");
      setLahanId("");
      setMusimTanamId("");
      setTanggalPanen("");
      setLuasPetak("");
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
    <Card className="max-w-4xl mx-auto shadow-md">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
              <Sprout className="size-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Catat Data Provitas Baru</CardTitle>
              <CardDescription>
                Input data ubinan panen lapangan untuk perhitungan produktivitas padi.
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
            void saveRecord("submitted", e.currentTarget);
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
          <div className="rounded-2xl border border-border bg-muted/20 p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Calculator className="size-4 text-primary" />
              <span>Pengukuran Ubinan Lapangan</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                <Label htmlFor="luas_petak">
                  Luas Petak (m²)
                  <span className="text-muted-foreground font-normal ml-1">(biasanya 6.25 m²)</span>
                </Label>
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
            <div className="mt-4 rounded-xl border border-primary/20 bg-secondary/50 p-4">
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
            ? "Data yang diajukan akan masuk ke antrean verifikasi admin."
            : "Data yang disimpan saat offline tersimpan aman di database lokal browser."}
        </p>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={(e) => {
              const form = (e.currentTarget.closest(".max-w-4xl")?.querySelector("#provitas-form") as HTMLFormElement) ?? null;
              if (form) void saveRecord("draft", form);
            }}
            className="flex-1 sm:flex-none gap-2"
          >
            <Save className="size-4" />
            <span>Simpan Draft</span>
          </Button>

          <Button
            type="submit"
            form="provitas-form"
            disabled={isSaving}
            className="flex-1 sm:flex-none gap-2 font-semibold shadow-xs"
          >
            <Send className="size-4" />
            <span>{isSaving ? "Menyimpan..." : "Kirim Pengajuan"}</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
