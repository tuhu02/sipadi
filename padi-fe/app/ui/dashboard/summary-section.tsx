import { ArrowRight, Plus, Sparkles } from "lucide-react";
import { References, SyncRecord } from "@/app/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  LoadingRows,
  RecordList,
  SummaryCard,
} from "./shared";
import { DashboardSection } from "./types";

export function SummarySection({
  references,
  isLoading,
  isPpl,
  provitas,
  luasAreal,
  onSectionChange,
  onStartProvitas,
}: {
  references: References | null;
  isLoading: boolean;
  isPpl: boolean;
  provitas: SyncRecord[];
  luasAreal: SyncRecord[];
  onSectionChange: (section: DashboardSection) => void;
  onStartProvitas?: () => void;
}) {
  return (
    <div className="space-y-6">
      <section
        aria-label="Ringkasan data"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <SummaryCard
          label="Desa Terjangkau"
          value={references?.desa.length}
          detail="Sesuai wilayah penugasan akun"
          icon="map"
          loading={isLoading}
        />
        <SummaryCard
          label="Lahan Tersedia"
          value={references?.lahan.length}
          detail="Petak sawah sampel binaan"
          icon="field"
          loading={isLoading}
        />
        <SummaryCard
          label="Catatan Provitas"
          value={provitas.length}
          detail="Data ubinan & panen lapangan"
          icon="chart"
          loading={isLoading}
        />
        <SummaryCard
          label="Laporan Luas Areal"
          value={luasAreal.length}
          detail="Laporan tanam, panen & puso"
          icon="leaf"
          loading={isLoading}
        />
      </section>

      {isPpl && (
        <Card className="border-primary/20 bg-gradient-to-r from-secondary/80 to-accent/40 shadow-xs">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <h3 className="text-base font-bold text-foreground">
                  Pencatatan Provitas Baru
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                Catat hasil ubinan panen dengan memilih wilayah, sampel lahan, dan musim tanam. Estimasi provitas (Ku/Ha) dihitung seketika.
              </p>
            </div>
            <Button
              onClick={onStartProvitas ? onStartProvitas : () => onSectionChange("provitas")}
              className="shrink-0 gap-2 font-semibold shadow-xs"
            >
              <Plus className="size-4" />
              Mulai Pencatatan
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold">Data Provitas Terbaru</CardTitle>
              <CardDescription className="text-xs">
                Catatan provitas terkini dari akun Anda
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSectionChange("provitas")}
              className="gap-1 text-xs font-semibold text-primary"
            >
              <span>Lihat semua</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingRows count={3} />
            ) : (
              <RecordList
                records={provitas.slice(0, 5)}
                section="provitas"
                emptyLabel="Belum ada data provitas yang dicatat."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold">Laporan Luas Areal</CardTitle>
              <CardDescription className="text-xs">
                Laporan bulanan luas tanam, panen, dan puso
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSectionChange("luas_areal")}
              className="gap-1 text-xs font-semibold text-primary"
            >
              <span>Lihat semua</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingRows count={3} />
            ) : (
              <RecordList
                records={luasAreal.slice(0, 5)}
                section="luas_areal"
                desa={references?.desa}
                emptyLabel="Belum ada laporan luas areal."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
