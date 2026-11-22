import { useMemo, useState } from "react";
import { ChevronRight, FilePlus, MapPin, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { References, SyncRecord } from "@/app/lib/auth";
import { LocalLuasAreal, LocalProvitas } from "@/app/lib/offline-store";
import LuasArealEntry from "@/app/ui/luas-areal-entry";
import ProvitasEntry from "@/app/ui/provitas-entry";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingRows } from "./shared";
import { formatDateOnly } from "./shared";

export function ProvitasSection({
  references,
  records,
  pendingCount,
  isLoading,
  isPpl,
  isEntryOpen,
  isOnline,
  onToggleEntry,
  onSave,
  onEdit,
  onDelete,
  editRecord,
  onCancelEdit,
}: {
  references: References | null;
  records: SyncRecord[];
  pendingCount: number;
  isLoading: boolean;
  isPpl: boolean;
  isEntryOpen: boolean;
  isOnline: boolean;
  onToggleEntry: () => void;
  onSave: (record: LocalProvitas) => Promise<void>;
  onEdit: (record: SyncRecord) => void;
  onDelete: (record: SyncRecord) => void;
  editRecord: SyncRecord | null;
  onCancelEdit: () => void;
}) {
  const [selectedKecamatanId, setSelectedKecamatanId] = useState("");
  const [selectedDesaId, setSelectedDesaId] = useState("");
  const [selectedLahanId, setSelectedLahanId] = useState("");

  const kecamatanList = useMemo(() => references?.kecamatan ?? [], [references]);
  const desaList = useMemo(() => references?.desa ?? [], [references]);
  const lahanList = useMemo(() => references?.lahan ?? [], [references]);

  const kecamatanWithData = useMemo(
    () => kecamatanList.filter((kecamatan) =>
      desaList.some((desa) =>
        desa.kecamatan_id === kecamatan.id &&
        lahanList.some((lahan) => lahan.desa_id === desa.id)
      )
    ),
    [kecamatanList, desaList, lahanList],
  );
  const filteredDesa = desaList.filter((desa) => desa.kecamatan_id === selectedKecamatanId);
  const filteredLahan = lahanList.filter((lahan) => lahan.desa_id === selectedDesaId);
  const selectedLahan = lahanList.find((lahan) => lahan.id === selectedLahanId);
  const selectedLahanRecords = records.filter(
    (record) => record.lahan_id === selectedLahanId && !record.deleted,
  );

  return (
    <div className="flex flex-col gap-6">
      {isEntryOpen && isPpl && (
        references ? (
          <ProvitasEntry
            key={`${editRecord?.id ?? "new"}:${selectedLahanId}`}
            kecamatan={references.kecamatan}
            desa={references.desa}
            lahan={references.lahan}
            musimTanam={references.musim_tanam}
            records={records}
            editRecord={editRecord}
            initialLahanId={editRecord?.lahan_id ?? selectedLahanId}
            onSave={onSave}
            isOnline={isOnline}
            onCancelEdit={onCancelEdit}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Form Pencatatan Belum Tersedia</CardTitle>
              <CardDescription>
                Form memerlukan daftar kecamatan tugas, desa, lahan, dan musim tanam. Hubungkan perangkat ke internet dan muat ulang referensi.
              </CardDescription>
            </CardHeader>
          </Card>
        )
      )}

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Catatan Data Provitas</h2>
          <p className="text-sm text-muted-foreground">
            Rekapitulasi pencatatan ubinan dan perhitungan provitas padi.
          </p>
        </div>
        <div className="space-y-4">
          {pendingCount > 0 && (
            <Alert variant="warning">
              <RefreshCw className="size-4" />
              <AlertDescription>
                Terdapat <strong>{pendingCount} catatan</strong> yang menunggu sinkronisasi dengan server.
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <LoadingRows count={4} />
          ) : !references ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Hubungkan perangkat ke internet untuk memuat referensi wilayah.
            </p>
          ) : (
            <div className="space-y-5">
              <nav className="flex flex-wrap items-center gap-1.5 border-b border-border pb-4">
                <Button
                  type="button"
                  variant={!selectedKecamatanId ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setSelectedKecamatanId("");
                    setSelectedDesaId("");
                    setSelectedLahanId("");
                  }}
                >
                  Kecamatan
                </Button>
                {selectedKecamatanId && (
                  <>
                    <ChevronRight className="size-4 text-muted-foreground" />
                    <Button
                      type="button"
                      variant={!selectedDesaId ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => {
                        setSelectedDesaId("");
                        setSelectedLahanId("");
                      }}
                    >
                      {kecamatanList.find((item) => item.id === selectedKecamatanId)?.nama}
                    </Button>
                  </>
                )}
                {selectedDesaId && (
                  <>
                    <ChevronRight className="size-4 text-muted-foreground" />
                    <Button
                      type="button"
                      variant={!selectedLahanId ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setSelectedLahanId("")}
                    >
                      {desaList.find((item) => item.id === selectedDesaId)?.nama}
                    </Button>
                  </>
                )}
                {selectedLahanId && (
                  <>
                    <ChevronRight className="size-4 text-muted-foreground" />
                    <span className="px-2 font-semibold text-foreground">
                      {selectedLahan?.kode_sampel}
                    </span>
                  </>
                )}
              </nav>

              {!selectedKecamatanId ? (
                kecamatanWithData.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {kecamatanWithData.map((kecamatan) => (
                      <button
                        key={kecamatan.id}
                        type="button"
                        onClick={() => {
                          setSelectedKecamatanId(kecamatan.id);
                          setSelectedDesaId("");
                          setSelectedLahanId("");
                        }}
                        className="rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-colors hover:border-primary/50 hover:bg-muted/30"
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
                            <MapPin className="size-5" />
                          </span>
                          <ChevronRight className="size-5 text-muted-foreground" />
                        </div>
                        <h3 className="mt-4 font-bold text-foreground">{kecamatan.nama}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">Kode {kecamatan.kode}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Belum ada catatan provitas.
                  </p>
                )
              ) : !selectedDesaId ? (
                filteredDesa.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredDesa.map((desa) => (
                      <button
                        key={desa.id}
                        type="button"
                        onClick={() => setSelectedDesaId(desa.id)}
                        className="rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-colors hover:border-primary/50 hover:bg-muted/30"
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
                            <MapPin className="size-5" />
                          </span>
                          <ChevronRight className="size-5 text-muted-foreground" />
                        </div>
                        <h3 className="mt-4 font-bold text-foreground">{desa.nama}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">Kode {desa.kode}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Belum ada desa di kecamatan ini.
                  </p>
                )
              ) : !selectedLahanId ? (
                filteredLahan.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredLahan.map((lahan) => {
                      const count = records.filter((record) => record.lahan_id === lahan.id && !record.deleted).length;
                      return (
                        <button
                          key={lahan.id}
                          type="button"
                          onClick={() => setSelectedLahanId(lahan.id)}
                          className="rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-colors hover:border-primary/50 hover:bg-muted/30"
                        >
                          <div className="flex items-center justify-between">
                            <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
                              <MapPin className="size-5" />
                            </span>
                            <ChevronRight className="size-5 text-muted-foreground" />
                          </div>
                          <h3 className="mt-4 font-bold text-foreground">{lahan.kode_sampel}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{lahan.nama_petani}</p>
                          <p className="mt-3 text-xs text-muted-foreground">
                            {lahan.luas_lahan_ha} ha · {count} catatan provitas
                          </p>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Belum ada lahan di desa ini.
                  </p>
                )
              ) : (
                <section className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-bold text-foreground">
                        Catatan provitas · {selectedLahan?.kode_sampel}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedLahan?.nama_petani} · {selectedLahanRecords.length} catatan
                      </p>
                    </div>
                    {isPpl && !isEntryOpen && (
                      <Button
                        type="button"
                        variant="default"
                        onClick={onToggleEntry}
                        className="gap-2 font-semibold shadow-xs"
                      >
                        <Plus className="size-4" />
                        Catat Provitas
                      </Button>
                    )}
                  </div>
                  {selectedLahanRecords.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tanggal panen</TableHead>
                            <TableHead>Musim</TableHead>
                            <TableHead>Luas petak</TableHead>
                            <TableHead>Berat gabah</TableHead>
                            <TableHead>Provitas</TableHead>
                            {isPpl && <TableHead className="text-right">Aksi</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedLahanRecords.map((record) => {
                            const musim = references.musim_tanam.find((item) => item.id === record.musim_tanam_id);
                            return (
                              <TableRow key={record.id}>
                                <TableCell>{formatDateOnly(record.tanggal_panen)}</TableCell>
                                <TableCell>{musim?.nama ?? "—"}</TableCell>
                                <TableCell>{record.luas_petak_m2} m²</TableCell>
                                <TableCell>{record.berat_gabah_kg} kg</TableCell>
                                <TableCell className="font-semibold">{record.provitas_kuha} Ku/Ha</TableCell>
                                {isPpl && (
                                  <TableCell>
                                    <div className="flex justify-end gap-2">
                                      <Button type="button" variant="outline" size="sm" onClick={() => onEdit(record)} className="gap-1.5">
                                        <Pencil className="size-3.5" />
                                        Edit
                                      </Button>
                                      <Button type="button" variant="destructive" size="sm" onClick={() => onDelete(record)} className="gap-1.5">
                                        <Trash2 className="size-3.5" />
                                        Hapus
                                      </Button>
                                    </div>
                                  </TableCell>
                                )}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Belum ada catatan provitas untuk lahan ini.
                    </p>
                  )}
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function LuasArealSection({
  references,
  records,
  pendingCount,
  isLoading,
  isPpl,
  isEntryOpen,
  isOnline,
  onToggleEntry,
  onSave,
  onEdit,
  onDelete,
  editRecord,
  onCancelEdit,
}: {
  references: References | null;
  records: SyncRecord[];
  pendingCount: number;
  isLoading: boolean;
  isPpl: boolean;
  isEntryOpen: boolean;
  isOnline: boolean;
  onToggleEntry: () => void;
  onSave: (record: LocalLuasAreal) => Promise<void>;
  onEdit: (record: SyncRecord) => void;
  onDelete: (record: SyncRecord) => void;
  editRecord: SyncRecord | null;
  onCancelEdit: () => void;
}) {
  const [selectedKecamatanId, setSelectedKecamatanId] = useState("");
  const [selectedDesaId, setSelectedDesaId] = useState("");
  const kecamatanList = useMemo(() => references?.kecamatan ?? [], [references]);
  const desaList = useMemo(() => references?.desa ?? [], [references]);
  const kecamatanWithData = useMemo(
    () => kecamatanList.filter((kecamatan) =>
      desaList.some((desa) => desa.kecamatan_id === kecamatan.id)
    ),
    [kecamatanList, desaList],
  );
  const filteredDesa = desaList.filter((desa) => desa.kecamatan_id === selectedKecamatanId);
  const selectedDesa = desaList.find((desa) => desa.id === selectedDesaId);
  const selectedDesaRecords = records.filter(
    (record) => record.desa_id === selectedDesaId && !record.deleted,
  );

  return (
    <div className="flex flex-col gap-6">
      {isEntryOpen && isPpl && (
        references ? (
          <LuasArealEntry
            key={editRecord?.id ?? "new"}
            desa={references.desa}
            records={records}
            isOnline={isOnline}
            onSave={onSave}
            editRecord={editRecord}
            initialDesaId={editRecord?.desa_id ?? selectedDesaId}
            onCancelEdit={onCancelEdit}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Referensi Desa Belum Tersedia</CardTitle>
              <CardDescription>
                Hubungkan perangkat ke internet untuk memuat data referensi desa sebelum membuat laporan luas areal.
              </CardDescription>
            </CardHeader>
          </Card>
        )
      )}

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold">Laporan Luas Areal Bulanan</CardTitle>
            <CardDescription>
              Data rekapitulasi luas tanam, panen, dan puso per desa tiap bulan.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingCount > 0 && (
            <Alert variant="warning">
              <RefreshCw className="size-4" />
              <AlertDescription>
                Terdapat <strong>{pendingCount} laporan</strong> yang menunggu sinkronisasi dengan server.
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <LoadingRows count={4} />
          ) : !references ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Hubungkan perangkat ke internet untuk memuat referensi wilayah.
            </p>
          ) : (
            <div className="space-y-5">
              <nav className="flex flex-wrap items-center gap-1.5 border-b border-border pb-4">
                <Button
                  type="button"
                  variant={!selectedKecamatanId ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setSelectedKecamatanId("");
                    setSelectedDesaId("");
                  }}
                >
                  Kecamatan
                </Button>
                {selectedKecamatanId && (
                  <>
                    <ChevronRight className="size-4 text-muted-foreground" />
                    <Button
                      type="button"
                      variant={!selectedDesaId ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setSelectedDesaId("")}
                    >
                      {kecamatanList.find((item) => item.id === selectedKecamatanId)?.nama}
                    </Button>
                  </>
                )}
                {selectedDesaId && (
                  <>
                    <ChevronRight className="size-4 text-muted-foreground" />
                    <span className="px-2 font-semibold text-foreground">
                      {selectedDesa?.nama}
                    </span>
                  </>
                )}
              </nav>

              {!selectedKecamatanId ? (
                kecamatanWithData.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {kecamatanWithData.map((kecamatan) => (
                      <button
                        key={kecamatan.id}
                        type="button"
                        onClick={() => {
                          setSelectedKecamatanId(kecamatan.id);
                          setSelectedDesaId("");
                        }}
                        className="rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-colors hover:border-primary/50 hover:bg-muted/30"
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
                            <MapPin className="size-5" />
                          </span>
                          <ChevronRight className="size-5 text-muted-foreground" />
                        </div>
                        <h3 className="mt-4 font-bold text-foreground">{kecamatan.nama}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">Kode {kecamatan.kode}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Belum ada laporan luas areal.
                  </p>
                )
              ) : !selectedDesaId ? (
                filteredDesa.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredDesa.map((desa) => {
                      const count = records.filter((record) => record.desa_id === desa.id && !record.deleted).length;
                      return (
                        <button
                          key={desa.id}
                          type="button"
                          onClick={() => setSelectedDesaId(desa.id)}
                          className="rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-colors hover:border-primary/50 hover:bg-muted/30"
                        >
                          <div className="flex items-center justify-between">
                            <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
                              <MapPin className="size-5" />
                            </span>
                            <ChevronRight className="size-5 text-muted-foreground" />
                          </div>
                          <h3 className="mt-4 font-bold text-foreground">{desa.nama}</h3>
                          <p className="mt-1 text-xs text-muted-foreground">Kode {desa.kode}</p>
                          <p className="mt-3 text-xs text-muted-foreground">{count} laporan bulanan</p>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Belum ada desa di kecamatan ini.
                  </p>
                )
              ) : (
                <section className="space-y-4">
                  <div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="font-bold text-foreground">
                          Laporan luas areal · {selectedDesa?.nama}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedDesaRecords.length} laporan bulanan
                        </p>
                      </div>
                      {isPpl && selectedDesaRecords.length === 0 && !isEntryOpen && (
                        <Button
                          type="button"
                          variant="default"
                          onClick={onToggleEntry}
                          className="gap-2 font-semibold shadow-xs"
                        >
                          <FilePlus className="size-4" />
                          Buat Laporan
                        </Button>
                      )}
                    </div>
                  </div>
                  {selectedDesaRecords.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Periode</TableHead>
                            <TableHead>Tanam</TableHead>
                            <TableHead>Panen</TableHead>
                            <TableHead>Puso</TableHead>
                            {isPpl && <TableHead className="text-right">Aksi</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedDesaRecords
                            .slice()
                            .sort((a, b) => Number(b.tahun) - Number(a.tahun) || Number(b.bulan) - Number(a.bulan))
                            .map((record) => (
                              <TableRow key={record.id}>
                                <TableCell className="font-medium">
                                  {[ "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember" ][Number(record.bulan) - 1]} {record.tahun}
                                </TableCell>
                                <TableCell>{record.luas_tanam_ha ?? 0} ha</TableCell>
                                <TableCell>{record.luas_panen_ha ?? 0} ha</TableCell>
                                <TableCell>{record.luas_puso_ha ?? 0} ha</TableCell>
                                {isPpl && (
                                  <TableCell>
                                    <div className="flex justify-end gap-2">
                                      <Button type="button" variant="outline" size="sm" onClick={() => onEdit(record)} className="gap-1.5">
                                        <Pencil className="size-3.5" />
                                        Edit
                                      </Button>
                                      <Button type="button" variant="destructive" size="sm" onClick={() => onDelete(record)} className="gap-1.5">
                                        <Trash2 className="size-3.5" />
                                        Hapus
                                      </Button>
                                    </div>
                                  </TableCell>
                                )}
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Belum ada laporan luas areal untuk desa ini.
                    </p>
                  )}
                </section>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
