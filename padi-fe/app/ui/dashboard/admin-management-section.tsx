"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  MapPin,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  AdminRecord,
  AdminResource,
  createAdminRecord,
  deleteAdminRecord,
  getAdminRecords,
  updateAdminRecord,
} from "@/app/lib/admin";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateOnly } from "./shared";

type AdminLists = Record<AdminResource, AdminRecord[]>;

type AdminField = {
  name: string;
  label: string;
  type: "text" | "email" | "password" | "number" | "date" | "select" | "textarea";
  required?: boolean;
  step?: string;
  min?: string;
  max?: string;
  options?: { value: string; label: string }[];
  placeholder?: string;
};

const resourceInfo: Record<
  AdminResource,
  { label: string; singular: string; description: string; columns: string[] }
> = {
  users: {
    label: "Akun",
    singular: "akun",
    description: "Buat akun admin atau PPL dan atur kredensialnya.",
    columns: ["nama", "email", "role"],
  },
  kecamatan: {
    label: "Kecamatan",
    singular: "kecamatan",
    description: "Kelola daftar kecamatan.",
    columns: ["kode", "nama"],
  },
  desa: {
    label: "Desa",
    singular: "desa",
    description: "Hubungkan setiap desa ke kecamatan.",
    columns: ["kode", "nama", "kecamatan_id"],
  },
  lahan: {
    label: "Lahan",
    singular: "lahan",
    description: "Atur lahan sampel dan luasnya di setiap desa.",
    columns: ["nama_petani", "kode_sampel", "luas_lahan_ha", "desa_id"],
  },
  provitas: {
    label: "Provitas",
    singular: "catatan provitas",
    description: "Kelola catatan ubinan PPL dan hasil perhitungan produktivitas.",
    columns: [
      "tanggal_panen",
      "ppl_id",
      "lahan_id",
      "musim_tanam_id",
      "luas_petak_m2",
      "berat_gabah_kg",
      "provitas_kuha",
    ],
  },
  "luas-areal": {
    label: "Luas Areal",
    singular: "laporan luas areal",
    description: "Kelola laporan luas tanam, panen, dan puso bulanan per desa.",
    columns: [
      "tahun",
      "bulan",
      "ppl_id",
      "luas_tanam_ha",
      "luas_panen_ha",
      "luas_puso_ha",
    ],
  },
  "musim-tanam": {
    label: "Musim tanam",
    singular: "musim tanam",
    description: "Atur nama dan rentang tanggal musim tanam.",
    columns: ["nama", "tanggal_mulai", "tanggal_selesai"],
  },
  penugasan: {
    label: "Penugasan",
    singular: "penugasan",
    description: "Tetapkan kecamatan dan masa tugas untuk akun PPL.",
    columns: ["user_id", "kecamatan_id", "tanggal_mulai", "tanggal_selesai"],
  },
};

const resources = Object.keys(resourceInfo) as AdminResource[];

const fieldLabels: Record<string, string> = {
  nama: "Nama",
  email: "Email",
  password: "Kata sandi",
  role: "Peran",
  kode: "Kode",
  kecamatan_id: "Kecamatan",
  desa_id: "Desa",
  nama_petani: "Nama petani",
  kode_sampel: "Kode sampel",
  luas_lahan_ha: "Luas lahan (ha)",
  ppl_id: "PPL",
  lahan_id: "Lahan / sampel",
  musim_tanam_id: "Musim tanam",
  tanggal_panen: "Tanggal panen",
  luas_petak_m2: "Luas petak",
  berat_gabah_kg: "Berat gabah",
  provitas_kuha: "Provitas",
  kadar_air: "Kadar air (%)",
  catatan: "Catatan",
  latitude: "Latitude",
  longitude: "Longitude",
  tanggal_mulai: "Tanggal mulai",
  tanggal_selesai: "Tanggal selesai",
  user_id: "Akun PPL",
  tahun: "Tahun",
  bulan: "Bulan",
  luas_tanam_ha: "Luas tanam (ha)",
  luas_panen_ha: "Luas panen (ha)",
  luas_puso_ha: "Luas puso (ha)",
};

function recordValue(record: AdminRecord, key: string): string {
  const value = record[key];
  return value === null || value === undefined ? "" : String(value);
}

function buildFields(
  resource: AdminResource,
  lists: AdminLists,
  isEditing: boolean,
): AdminField[] {
  const kecamatanOptions = lists.kecamatan.map((record) => ({
    value: record.id,
    label: `${recordValue(record, "nama")} (${recordValue(record, "kode")})`,
  }));
  const desaOptions = lists.desa.map((record) => ({
    value: record.id,
    label: `${recordValue(record, "nama")} (${recordValue(record, "kode")})`,
  }));
  const lahanOptions = lists.lahan.map((record) => ({
    value: record.id,
    label: `${recordValue(record, "kode_sampel")} — ${recordValue(record, "nama_petani")}`,
  }));
  const musimTanamOptions = lists["musim-tanam"].map((record) => ({
    value: record.id,
    label: recordValue(record, "nama"),
  }));

  switch (resource) {
    case "users":
      return [
        { name: "nama", label: "Nama", type: "text", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        {
          name: "password",
          label: isEditing
            ? "Kata sandi baru (kosongkan jika tidak diubah)"
            : "Kata sandi",
          type: "password",
          required: !isEditing,
          placeholder: isEditing ? "Tidak diubah jika kosong" : undefined,
        },
        {
          name: "role",
          label: "Peran",
          type: "select",
          required: true,
          options: [
            { value: "ppl", label: "PPL" },
            { value: "admin", label: "Admin" },
          ],
        },
      ];
    case "kecamatan":
      return [
        { name: "kode", label: "Kode", type: "text", required: true },
        { name: "nama", label: "Nama", type: "text", required: true },
      ];
    case "desa":
      return [
        {
          name: "kecamatan_id",
          label: "Kecamatan",
          type: "select",
          required: true,
          options: kecamatanOptions,
        },
        { name: "kode", label: "Kode", type: "text", required: true },
        { name: "nama", label: "Nama", type: "text", required: true },
      ];
    case "lahan":
      return [
        {
          name: "desa_id",
          label: "Desa",
          type: "select",
          required: true,
          options: desaOptions,
        },
        {
          name: "nama_petani",
          label: "Nama petani",
          type: "text",
          required: true,
        },
        {
          name: "kode_sampel",
          label: "Kode sampel",
          type: "text",
          required: true,
        },
        {
          name: "luas_lahan_ha",
          label: "Luas lahan (ha)",
          type: "number",
          required: true,
          step: "0.01",
        },
        { name: "latitude", label: "Latitude", type: "number", step: "any" },
        { name: "longitude", label: "Longitude", type: "number", step: "any" },
      ];
    case "provitas":
      return [
        {
          name: "ppl_id",
          label: "Akun PPL",
          type: "select",
          required: true,
          options: lists.users
            .filter((record) => recordValue(record, "role") === "ppl")
            .map((record) => ({
              value: record.id,
              label: `${recordValue(record, "nama")} (${recordValue(record, "email")})`,
            })),
        },
        {
          name: "lahan_id",
          label: "Lahan / sampel",
          type: "select",
          required: true,
          options: lahanOptions,
        },
        {
          name: "musim_tanam_id",
          label: "Musim tanam",
          type: "select",
          required: true,
          options: musimTanamOptions,
        },
        {
          name: "tanggal_panen",
          label: "Tanggal panen",
          type: "date",
          required: true,
        },
        {
          name: "luas_petak_m2",
          label: "Luas petak (m²)",
          type: "number",
          required: true,
          step: "0.01",
          min: "0.01",
          max: "999999.99",
        },
        {
          name: "berat_gabah_kg",
          label: "Berat gabah (kg)",
          type: "number",
          required: true,
          step: "0.01",
          max: "999999.99",
        },
        {
          name: "kadar_air",
          label: "Kadar air (%)",
          type: "number",
          step: "0.01",
          max: "100",
        },
        {
          name: "catatan",
          label: "Catatan",
          type: "textarea",
        },
      ];
    case "luas-areal":
      return [
        {
          name: "ppl_id",
          label: "Akun PPL",
          type: "select",
          required: true,
          options: lists.users
            .filter((record) => recordValue(record, "role") === "ppl")
            .map((record) => ({
              value: record.id,
              label: `${recordValue(record, "nama")} (${recordValue(record, "email")})`,
            })),
        },
        {
          name: "desa_id",
          label: "Desa",
          type: "select",
          required: true,
          options: desaOptions,
        },
        {
          name: "bulan",
          label: "Bulan",
          type: "select",
          required: true,
          options: [
            "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember",
          ].map((label, index) => ({ value: String(index + 1), label })),
        },
        {
          name: "tahun",
          label: "Tahun",
          type: "number",
          required: true,
          min: "2000",
          max: "2100",
        },
        {
          name: "luas_tanam_ha",
          label: "Luas tanam (ha)",
          type: "number",
          required: true,
          step: "0.01",
          max: "99999999.99",
        },
        {
          name: "luas_panen_ha",
          label: "Luas panen (ha)",
          type: "number",
          required: true,
          step: "0.01",
          max: "99999999.99",
        },
        {
          name: "luas_puso_ha",
          label: "Luas puso (ha)",
          type: "number",
          step: "0.01",
          max: "99999999.99",
        },
        { name: "catatan", label: "Catatan", type: "textarea" },
      ];
    case "musim-tanam":
      return [
        { name: "nama", label: "Nama", type: "text", required: true },
        {
          name: "tanggal_mulai",
          label: "Tanggal mulai",
          type: "date",
          required: true,
        },
        {
          name: "tanggal_selesai",
          label: "Tanggal selesai",
          type: "date",
          required: true,
        },
      ];
    case "penugasan":
      return [
        {
          name: "user_id",
          label: "Akun PPL",
          type: "select",
          required: true,
          options: lists.users
            .filter((record) => recordValue(record, "role") === "ppl")
            .map((record) => ({
              value: record.id,
              label: `${recordValue(record, "nama")} (${recordValue(record, "email")})`,
            })),
        },
        {
          name: "kecamatan_id",
          label: "Kecamatan",
          type: "select",
          required: true,
          options: kecamatanOptions,
        },
        {
          name: "tanggal_mulai",
          label: "Tanggal mulai",
          type: "date",
          required: true,
        },
        {
          name: "tanggal_selesai",
          label: "Tanggal selesai (opsional)",
          type: "date",
        },
      ];
  }
}

function displayRecordValue(
  resource: AdminResource,
  record: AdminRecord,
  key: string,
  lists: AdminLists,
): string {
  if (key === "kecamatan_id") {
    const kecamatan = lists.kecamatan.find(
      (item) => item.id === recordValue(record, key),
    );
    return kecamatan ? recordValue(kecamatan, "nama") : recordValue(record, key);
  }

  if (key === "desa_id") {
    const desa = lists.desa.find(
      (item) => item.id === recordValue(record, key),
    );
    return desa ? recordValue(desa, "nama") : recordValue(record, key);
  }

  if (key === "user_id") {
    const user = lists.users.find(
      (item) => item.id === recordValue(record, key),
    );
    return user ? recordValue(user, "nama") : recordValue(record, key);
  }

  if (key === "ppl_id") {
    const ppl = lists.users.find(
      (item) => item.id === recordValue(record, key),
    );
    return ppl
      ? `${recordValue(ppl, "nama")} (${recordValue(ppl, "email")})`
      : recordValue(record, key);
  }

  if (key === "lahan_id" && resource === "provitas") {
    const lahan = lists.lahan.find(
      (item) => item.id === recordValue(record, key),
    );
    return lahan
      ? `${recordValue(lahan, "kode_sampel")} — ${recordValue(lahan, "nama_petani")}`
      : recordValue(record, key);
  }

  if (key === "musim_tanam_id") {
    const musimTanam = lists["musim-tanam"].find(
      (item) => item.id === recordValue(record, key),
    );
    return musimTanam
      ? recordValue(musimTanam, "nama")
      : recordValue(record, key);
  }

  const value = recordValue(record, key);
  if (key === "bulan" && value) {
    return new Intl.DateTimeFormat("id-ID", { month: "long" }).format(
      new Date(2000, Number(value) - 1, 1),
    );
  }
  if (
    (key === "tanggal_mulai" ||
      key === "tanggal_selesai" ||
      key === "tanggal_panen") &&
    value
  ) {
    return formatDateOnly(value);
  }

  if (
    resource === "provitas" &&
    ["luas_petak_m2", "berat_gabah_kg", "provitas_kuha", "kadar_air"].includes(key) &&
    value
  ) {
    const formatted = new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 2,
    }).format(Number(value));
    if (key === "luas_petak_m2") return `${formatted} m²`;
    if (key === "berat_gabah_kg") return `${formatted} kg`;
    if (key === "provitas_kuha") return `${formatted} Ku/Ha`;
    return `${formatted}%`;
  }

  if (resource === "lahan" && key === "luas_lahan_ha" && value) {
    return `${value} ha`;
  }
  if (
    resource === "luas-areal" &&
    ["luas_tanam_ha", "luas_panen_ha", "luas_puso_ha"].includes(key) &&
    value
  ) {
    const formatted = new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 2,
    }).format(Number(value));
    return `${formatted} ha`;
  }
  return value || "—";
}

function emptyLists(): AdminLists {
  return {
    users: [],
    kecamatan: [],
    desa: [],
    lahan: [],
    provitas: [],
    "luas-areal": [],
    "musim-tanam": [],
    penugasan: [],
  };
}

export function AdminManagementSection({
  token,
  currentUserId,
  resource,
}: {
  token: string;
  currentUserId: string;
  resource: AdminResource;
}) {
  const [lists, setLists] = useState<AdminLists>(emptyLists);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [selectedKecamatanId, setSelectedKecamatanId] = useState("");
  const [selectedDesaId, setSelectedDesaId] = useState("");
  const [selectedLahanId, setSelectedLahanId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const results = await Promise.all(
        resources.map(async (key) => [
          key,
          await getAdminRecords<AdminRecord>(token, key),
        ] as const),
      );
      const next = emptyLists();
      for (const [key, records] of results) next[key] = records;
      setLists(next);
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Data admin tidak dapat dimuat.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRecords();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadRecords]);

  const fields = useMemo(
    () => buildFields(resource, lists, editingId !== null),
    [editingId, lists, resource],
  );
  const currentRecords = lists[resource];
  const currentInfo = resourceInfo[resource];
  const luasArealRecords = lists["luas-areal"];
  const kecamatanCards = useMemo(() => {
    const landCountByDesa = new Map<string, number>();
    for (const lahan of lists.lahan) {
      const desaId = recordValue(lahan, "desa_id");
      landCountByDesa.set(desaId, (landCountByDesa.get(desaId) ?? 0) + 1);
    }

    return lists.kecamatan
      .map((kecamatan) => {
        const desa = lists.desa.filter(
          (item) => recordValue(item, "kecamatan_id") === kecamatan.id,
        );
        const lahanCount = desa.reduce(
          (total, item) =>
            total + (landCountByDesa.get(item.id) ?? 0),
          0,
        );

        return { ...kecamatan, desaCount: desa.length, lahanCount };
      })
      .sort((first, second) =>
        recordValue(first, "nama").localeCompare(recordValue(second, "nama"), "id"),
      );
  }, [lists.desa, lists.kecamatan, lists.lahan]);
  const selectedKecamatan = lists.kecamatan.find(
    (item) => item.id === selectedKecamatanId,
  );
  const desaCards = useMemo(() => {
    const landCountByDesa = new Map<string, number>();
    for (const lahan of lists.lahan) {
      const desaId = recordValue(lahan, "desa_id");
      landCountByDesa.set(desaId, (landCountByDesa.get(desaId) ?? 0) + 1);
    }
    const reportCountByDesa = new Map<string, number>();
    for (const record of luasArealRecords) {
      if (record.deleted) continue;
      const desaId = recordValue(record, "desa_id");
      reportCountByDesa.set(desaId, (reportCountByDesa.get(desaId) ?? 0) + 1);
    }

    return lists.desa
      .filter(
        (desa) => recordValue(desa, "kecamatan_id") === selectedKecamatanId,
      )
      .map((desa) => ({
        ...desa,
        lahanCount: landCountByDesa.get(desa.id) ?? 0,
        reportCount: reportCountByDesa.get(desa.id) ?? 0,
      }))
      .sort((first, second) =>
        recordValue(first, "nama").localeCompare(recordValue(second, "nama"), "id"),
      );
  }, [lists.desa, lists.lahan, luasArealRecords, selectedKecamatanId]);
  const selectedDesa = lists.desa.find(
    (item) =>
      item.id === selectedDesaId &&
      recordValue(item, "kecamatan_id") === selectedKecamatanId,
  );
  const lahanCards = useMemo(() => {
    const provitasCountByLahan = new Map<string, number>();
    for (const record of lists.provitas) {
      if (record.deleted) continue;
      const lahanId = recordValue(record, "lahan_id");
      provitasCountByLahan.set(
        lahanId,
        (provitasCountByLahan.get(lahanId) ?? 0) + 1,
      );
    }

    return lists.lahan
      .filter((lahan) => recordValue(lahan, "desa_id") === selectedDesaId)
      .map((lahan) => ({
        ...lahan,
        provitasCount: provitasCountByLahan.get(lahan.id) ?? 0,
      }))
      .sort((first, second) =>
        recordValue(first, "kode_sampel").localeCompare(
          recordValue(second, "kode_sampel"),
          "id",
        ),
      );
  }, [lists.lahan, lists.provitas, selectedDesaId]);
  const selectedLahan = lists.lahan.find(
    (item) =>
      item.id === selectedLahanId &&
      recordValue(item, "desa_id") === selectedDesaId,
  );
  const selectedLahanProvitas = lists.provitas.filter(
    (record) =>
      recordValue(record, "lahan_id") === selectedLahanId &&
      !record.deleted,
  );
  const selectedDesaLahan = lists.lahan.filter(
    (item) => recordValue(item, "desa_id") === selectedDesaId,
  );
  const selectedDesaLuasAreal = luasArealRecords.filter(
    (record) =>
      recordValue(record, "desa_id") === selectedDesaId && !record.deleted,
  );

  function startCreate() {
    setEditingId(null);
    setFormValues(
      resource === "lahan" && selectedDesaId
        ? { desa_id: selectedDesaId }
        : resource === "provitas" && selectedLahanId
          ? { lahan_id: selectedLahanId }
          : resource === "luas-areal" && selectedDesaId
            ? { desa_id: selectedDesaId }
          : {},
    );
    setFormOpen(true);
    setError("");
    setMessage("");
  }

  function startEdit(record: AdminRecord) {
    setEditingId(record.id);
    setFormValues(
      Object.fromEntries(
        buildFields(resource, lists, true).map((field) => [
          field.name,
          field.type === "date"
            ? recordValue(record, field.name).slice(0, 10)
            : recordValue(record, field.name),
        ]),
      ),
    );
    setFormOpen(true);
    setError("");
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setMessage("");

    const data: Record<string, string | number> = {};
    for (const field of fields) {
      const value = formValues[field.name] ?? "";
      if (!value && (!field.required || (field.name === "password" && editingId))) {
        continue;
      }
      data[field.name] =
        field.type === "number" && value ? Number(value) : value;
    }

    try {
      if (editingId) {
        await updateAdminRecord(token, resource, editingId, data);
        setMessage(`${currentInfo.singular} berhasil diperbarui.`);
      } else {
        await createAdminRecord(token, resource, data);
        setMessage(`${currentInfo.singular} berhasil ditambahkan.`);
      }
      setFormOpen(false);
      setEditingId(null);
      await loadRecords();
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : `Gagal menyimpan ${currentInfo.singular}.`,
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(record: AdminRecord) {
    if (resource === "users" && record.id === currentUserId) {
      setError("Akun yang sedang digunakan tidak dapat dihapus.");
      return;
    }

    if (
      !window.confirm(
        `Hapus ${currentInfo.singular} "${displayRecordValue(
          resource,
          record,
          resource === "users" ? "nama" : currentInfo.columns[0],
          lists,
        )}"?`,
      )
    ) {
      return;
    }

    setDeletingId(record.id);
    setError("");
    setMessage("");
    try {
      await deleteAdminRecord(token, resource, record.id);
      setMessage(`${currentInfo.singular} berhasil dihapus.`);
      await loadRecords();
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : `Gagal menghapus ${currentInfo.singular}.`,
      );
    } finally {
      setDeletingId(null);
    }
  }

  function renderRecordsTable(records: AdminRecord[]) {
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {currentInfo.columns.map((column) => (
                <TableHead key={column}>
                  {fieldLabels[column] ?? column}
                </TableHead>
              ))}
              <TableHead className="w-28 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                {currentInfo.columns.map((column) => (
                  <TableCell key={column}>
                    {displayRecordValue(resource, record, column, lists)}
                  </TableCell>
                ))}
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(record)}
                      aria-label={`Ubah ${currentInfo.singular}`}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => void handleDelete(record)}
                      disabled={
                        deletingId === record.id ||
                        (resource === "users" && record.id === currentUserId)
                      }
                      aria-label={`Hapus ${currentInfo.singular}`}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  function renderLocationHierarchy() {
    return (
      <div className="space-y-5">
        <nav
          aria-label="Jelajah kecamatan, desa, dan lahan"
          className="flex flex-wrap items-center gap-1 text-sm"
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!selectedKecamatanId}
            onClick={() => {
              setSelectedKecamatanId("");
              setSelectedDesaId("");
              setSelectedLahanId("");
            }}
          >
            Kecamatan
          </Button>
          {selectedKecamatan && (
            <>
              <ChevronRight className="size-4 text-muted-foreground" />
              <Button
                type="button"
                variant={selectedDesa ? "ghost" : "secondary"}
                size="sm"
                disabled={!selectedDesa}
                onClick={() => {
                  setSelectedDesaId("");
                  setSelectedLahanId("");
                }}
              >
                {recordValue(selectedKecamatan, "nama")}
              </Button>
            </>
          )}
          {selectedDesa && (
            <>
              <ChevronRight className="size-4 text-muted-foreground" />
              <Button
                type="button"
                variant={selectedLahan ? "ghost" : "secondary"}
                size="sm"
                disabled={!selectedLahan}
                onClick={() => setSelectedLahanId("")}
              >
                {recordValue(selectedDesa, "nama")}
              </Button>
            </>
          )}
          {resource === "provitas" && selectedLahan && (
            <>
              <ChevronRight className="size-4 text-muted-foreground" />
              <span className="px-2 font-semibold text-foreground">
                {recordValue(selectedLahan, "kode_sampel")}
              </span>
            </>
          )}
        </nav>

        {!selectedKecamatan ? (
          kecamatanCards.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {kecamatanCards.map((kecamatan) => (
                <button
                  key={kecamatan.id}
                  type="button"
                  onClick={() => {
                    setSelectedKecamatanId(kecamatan.id);
                    setSelectedDesaId("");
                    setSelectedLahanId("");
                  }}
                  className="rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-colors hover:border-primary/50 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
                      <MapPin className="size-5" />
                    </span>
                    <ChevronRight className="size-5 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 font-bold text-foreground">
                    {recordValue(kecamatan, "nama")}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Kode {recordValue(kecamatan, "kode")}
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {kecamatan.desaCount} desa · {kecamatan.lahanCount} lahan
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Belum ada data kecamatan.
            </p>
          )
        ) : !selectedDesa ? (
          desaCards.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {desaCards.map((desa) => (
                <button
                  key={desa.id}
                  type="button"
                  onClick={() => setSelectedDesaId(desa.id)}
                  className="rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-colors hover:border-primary/50 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
                      <MapPin className="size-5" />
                    </span>
                    <ChevronRight className="size-5 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 font-bold text-foreground">
                    {recordValue(desa, "nama")}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Kode {recordValue(desa, "kode")}
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {resource === "luas-areal"
                      ? `${desa.reportCount} laporan bulanan`
                      : `${desa.lahanCount} lahan`}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Belum ada desa di kecamatan ini.
            </p>
          )
        ) : resource === "luas-areal" && selectedDesa ? (
          <section className="space-y-4">
            <div>
              <h3 className="font-bold text-foreground">
                Laporan luas areal · {recordValue(selectedDesa, "nama")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedDesaLuasAreal.length} laporan bulanan
              </p>
            </div>
            {selectedDesaLuasAreal.length > 0 ? (
              renderRecordsTable(
                selectedDesaLuasAreal
                  .slice()
                  .sort(
                    (first, second) =>
                      Number(recordValue(second, "tahun")) -
                        Number(recordValue(first, "tahun")) ||
                      Number(recordValue(second, "bulan")) -
                        Number(recordValue(first, "bulan")),
                  ),
              )
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Belum ada laporan luas areal untuk desa ini. Gunakan tombol
                Tambah laporan luas areal untuk membuat laporan.
              </p>
            )}
          </section>
        ) : resource === "provitas" && !selectedLahan ? (
          lahanCards.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {lahanCards.map((lahan) => (
                <button
                  key={lahan.id}
                  type="button"
                  onClick={() => setSelectedLahanId(lahan.id)}
                  className="rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-colors hover:border-primary/50 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
                      <MapPin className="size-5" />
                    </span>
                    <ChevronRight className="size-5 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 font-bold text-foreground">
                    {recordValue(lahan, "kode_sampel")}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {recordValue(lahan, "nama_petani")}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {recordValue(lahan, "luas_lahan_ha")} ha · {lahan.provitasCount} catatan provitas
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Belum ada lahan di desa ini.
            </p>
          )
        ) : resource === "provitas" && selectedLahan ? (
          <section className="space-y-4">
            <div>
              <h3 className="font-bold text-foreground">
                Catatan provitas · {recordValue(selectedLahan, "kode_sampel")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {recordValue(selectedLahan, "nama_petani")} · {selectedLahanProvitas.length} catatan
              </p>
            </div>
            {selectedLahanProvitas.length > 0 ? (
              renderRecordsTable(selectedLahanProvitas)
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Belum ada catatan provitas untuk lahan ini.
              </p>
            )}
          </section>
        ) : (
          <section className="space-y-4">
            <div>
              <h3 className="font-bold text-foreground">
                Lahan di {recordValue(selectedDesa, "nama")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedDesaLahan.length} lahan terdaftar
              </p>
            </div>
            {selectedDesaLahan.length > 0 ? (
              renderRecordsTable(selectedDesaLahan)
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Belum ada lahan di desa ini. Gunakan tombol Tambah lahan untuk
                menambahkan data.
              </p>
            )}
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {message && (
        <Alert variant="success">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{currentInfo.label}</CardTitle>
            <CardDescription>{currentInfo.description}</CardDescription>
          </div>
          {!formOpen && (
            <Button onClick={startCreate} className="gap-2">
              <Plus className="size-4" />
              Tambah {currentInfo.singular}
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-5">
          {formOpen && (
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-border bg-muted/20 p-4 sm:p-5"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="font-semibold">
                  {editingId ? "Ubah" : "Tambah"} {currentInfo.singular}
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setFormOpen(false)}
                  aria-label="Tutup formulir"
                >
                  <X className="size-4" />
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {fields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={`admin-${field.name}`}>{field.label}</Label>
                    {field.type === "select" ? (
                      <select
                        id={`admin-${field.name}`}
                        required={field.required}
                        disabled={
                          resource === "users" &&
                          field.name === "role" &&
                          editingId === currentUserId
                        }
                        value={formValues[field.name] ?? ""}
                        onChange={(event) =>
                          setFormValues((current) => ({
                            ...current,
                            [field.name]: event.target.value,
                          }))
                        }
                        className="flex h-11 w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">Pilih {field.label.toLowerCase()}</option>
                        {field.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : field.type === "textarea" ? (
                      <Textarea
                        id={`admin-${field.name}`}
                        required={field.required}
                        placeholder={field.placeholder}
                        value={formValues[field.name] ?? ""}
                        onChange={(event) =>
                          setFormValues((current) => ({
                            ...current,
                            [field.name]: event.target.value,
                          }))
                        }
                      />
                    ) : (
                      <Input
                        id={`admin-${field.name}`}
                        type={field.type}
                        required={field.required}
                        step={field.step}
                        max={field.max}
                        min={field.min ?? (
                          field.type === "number" &&
                          field.name !== "latitude" &&
                          field.name !== "longitude"
                            ? "0"
                            : undefined
                        )}
                        minLength={
                          field.type === "password" ? 8 : undefined
                        }
                        autoComplete={
                          field.type === "password" ? "new-password" : undefined
                        }
                        placeholder={field.placeholder}
                        value={formValues[field.name] ?? ""}
                        onChange={(event) =>
                          setFormValues((current) => ({
                            ...current,
                            [field.name]: event.target.value,
                          }))
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormOpen(false)}
                  disabled={isSaving}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isSaving} className="gap-2">
                  <Save className="size-4" />
                  {isSaving ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </form>
          )}

          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Memuat data...
            </p>
          ) : resource === "lahan" ? (
            renderLocationHierarchy()
          ) : resource === "provitas" || resource === "luas-areal" ? (
            renderLocationHierarchy()
          ) : currentRecords.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Belum ada data {currentInfo.label.toLowerCase()}.
            </p>
          ) : (
            renderRecordsTable(currentRecords)
          )}
        </CardContent>
      </Card>
    </div>
  );
}
