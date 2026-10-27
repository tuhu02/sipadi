import { FilePlus, Plus, RefreshCw } from "lucide-react";
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
import { LoadingRows, RecordList } from "./shared";

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
}) {
  return (
    <div className="flex flex-col gap-6">
      {isEntryOpen && isPpl && (
        references ? (
          <ProvitasEntry
            kecamatan={references.kecamatan}
            desa={references.desa}
            lahan={references.lahan}
            musimTanam={references.musim_tanam}
            onSave={onSave}
            isOnline={isOnline}
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

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold">Catatan Data Provitas</CardTitle>
            <CardDescription>
              Rekapitulasi pencatatan ubinan dan perhitungan provitas padi.
            </CardDescription>
          </div>
          {isPpl && (
            <Button
              variant={isEntryOpen ? "secondary" : "default"}
              onClick={onToggleEntry}
              className="gap-2 font-semibold shadow-xs"
            >
              {isEntryOpen ? (
                "Tutup Formulir"
              ) : (
                <>
                  <Plus className="size-4" />
                  Catat Provitas
                </>
              )}
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
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
          ) : (
            <RecordList
              records={records}
              section="provitas"
              emptyLabel="Catatan provitas Anda akan tampil setelah dibuat."
            />
          )}
        </CardContent>
      </Card>
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
}) {
  return (
    <div className="flex flex-col gap-6">
      {isEntryOpen && isPpl && (
        references ? (
          <LuasArealEntry
            desa={references.desa}
            records={records}
            isOnline={isOnline}
            onSave={onSave}
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
          {isPpl && (
            <Button
              variant={isEntryOpen ? "secondary" : "default"}
              onClick={onToggleEntry}
              className="gap-2 font-semibold shadow-xs"
            >
              {isEntryOpen ? (
                "Tutup Formulir"
              ) : (
                <>
                  <FilePlus className="size-4" />
                  Buat Laporan Baru
                </>
              )}
            </Button>
          )}
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
          ) : (
            <RecordList
              desa={references?.desa}
              records={records}
              section="luas_areal"
              emptyLabel="Belum ada laporan luas areal yang dibuat."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
