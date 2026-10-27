import { Calendar, Layers, MapPin, User } from "lucide-react";
import { References } from "@/app/lib/auth";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyNotice, LoadingRows } from "./shared";

export function TerritorySection({
  references,
  isLoading,
}: {
  references: References | null;
  isLoading: boolean;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="size-5 text-primary" />
            <CardTitle>Wilayah Desa & Lahan Penugasan</CardTitle>
          </div>
          <CardDescription>
            Daftar desa dan sampel lahan aktif yang dialokasikan ke akun Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingRows count={4} />
          ) : references?.desa.length ? (
            <div className="flex flex-col gap-4">
              {references.desa.map((desa) => {
                const lands = references.lahan.filter(
                  (lahan) => lahan.desa_id === desa.id
                );

                return (
                  <div
                    key={desa.id}
                    className="rounded-2xl border border-border bg-card/50 p-4 transition-colors hover:border-border/90"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-foreground text-base">
                            {desa.nama}
                          </h3>
                          <Badge variant="outline" className="text-[11px] font-mono">
                            Kode: {desa.kode}
                          </Badge>
                        </div>
                      </div>
                      <Badge variant="secondary" className="w-fit font-semibold">
                        {lands.length} Petak Lahan
                      </Badge>
                    </div>

                    {lands.length ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {lands.map((lahan) => (
                          <div
                            key={lahan.id}
                            className="rounded-xl border border-border/60 bg-muted/30 p-3.5 space-y-1.5 transition-all hover:bg-muted/60"
                          >
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                <User className="size-3.5 text-primary" />
                                {lahan.nama_petani}
                              </span>
                              <Badge variant="outline" className="text-[10px] bg-background">
                                {lahan.kode_sampel}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Layers className="size-3 text-muted-foreground" />
                              <span>Luas: <strong className="text-foreground">{lahan.luas_lahan_ha}</strong> ha</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-muted-foreground italic">
                        Belum ada data petak lahan terdaftar pada desa ini.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyNotice message="Belum ada referensi wilayah yang ditugaskan untuk akun ini." />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="size-5 text-primary" />
            <CardTitle>Musim Tanam Tersedia</CardTitle>
          </div>
          <CardDescription>
            Periode musim tanam acuan untuk pencatatan provitas dan luas areal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingRows count={2} />
          ) : references?.musim_tanam.length ? (
            <div className="flex flex-wrap gap-2.5">
              {references.musim_tanam.map((musim) => (
                <div
                  key={musim.id}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3.5 py-2 text-xs font-medium text-foreground"
                >
                  <Calendar className="size-3.5 text-primary" />
                  <span className="font-semibold">{musim.nama}</span>
                  <span className="text-muted-foreground">
                    ({musim.tanggal_mulai} s/d {musim.tanggal_selesai})
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Belum ada data musim tanam tersedia.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
