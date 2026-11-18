"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AdminLists = Record<AdminResource, AdminRecord[]>;

type AdminField = {
  name: string;
  label: string;
  type: "text" | "email" | "password" | "number" | "date" | "select";
  required?: boolean;
  step?: string;
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
  latitude: "Latitude",
  longitude: "Longitude",
  tanggal_mulai: "Tanggal mulai",
  tanggal_selesai: "Tanggal selesai",
  user_id: "Akun PPL",
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

  const value = recordValue(record, key);
  if (resource === "lahan" && key === "luas_lahan_ha" && value) {
    return `${value} ha`;
  }
  return value || "—";
}

function emptyLists(): AdminLists {
  return {
    users: [],
    kecamatan: [],
    desa: [],
    lahan: [],
    "musim-tanam": [],
    penugasan: [],
  };
}

export function AdminManagementSection({
  token,
  currentUserId,
}: {
  token: string;
  currentUserId: string;
}) {
  const [resource, setResource] = useState<AdminResource>("users");
  const [lists, setLists] = useState<AdminLists>(emptyLists);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
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

  function startCreate() {
    setEditingId(null);
    setFormValues({});
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

  function changeResource(nextResource: AdminResource) {
    setResource(nextResource);
    setFormOpen(false);
    setEditingId(null);
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Kelola data SiPadi</CardTitle>
          <CardDescription>
            Tambah, ubah, dan hapus akun serta data master. Perubahan disimpan
            langsung ke server.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="flex gap-2 overflow-x-auto pb-2"
            role="group"
            aria-label="Jenis data admin"
          >
            {resources.map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={resource === key}
                onClick={() => changeResource(key)}
                className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                  resource === key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {resourceInfo[key].label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

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
                    ) : (
                      <Input
                        id={`admin-${field.name}`}
                        type={field.type}
                        required={field.required}
                        step={field.step}
                        min={
                          field.type === "number" &&
                          field.name !== "latitude" &&
                          field.name !== "longitude"
                            ? "0"
                            : undefined
                        }
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
          ) : currentRecords.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Belum ada data {currentInfo.label.toLowerCase()}.
            </p>
          ) : (
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
                {currentRecords.map((record) => (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
