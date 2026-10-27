import { apiRequest } from "@/app/lib/api";

export type User = {
  id: string;
  nama: string;
  email: string;
  role: "ppl" | "admin";
};

export type ReferenceDesa = {
  id: string;
  kecamatan_id: string;
  kode: string;
  nama: string;
};

export type ReferenceKecamatan = {
  id: string;
  kode: string;
  nama: string;
};

export type ReferenceLahan = {
  id: string;
  desa_id: string;
  nama_petani: string;
  kode_sampel: string;
  luas_lahan_ha: number | string;
};

export type ReferenceMusimTanam = {
  id: string;
  nama: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
};

export type SyncRecord = {
  id: string;
  status: "draft" | "submitted" | "verified" | "rejected";
  updated_at: string;
  created_at?: string | null;
  synced_at: string | null;
  deleted: boolean;
  sync_error?: string | null;
  catatan_verifikasi?: string | null;
  tanggal_panen?: string;
  lahan_id?: string;
  musim_tanam_id?: string;
  luas_petak_m2?: number | string;
  berat_gabah_kg?: number | string;
  kadar_air?: number | string | null;
  provitas_kuha?: number | string;
  catatan?: string | null;
  desa_id?: string;
  tahun?: number;
  bulan?: number;
  luas_tanam_ha?: number | string;
  luas_panen_ha?: number | string;
  luas_puso_ha?: number | string | null;
};

export type References = {
  kecamatan: ReferenceKecamatan[];
  desa: ReferenceDesa[];
  lahan: ReferenceLahan[];
  musim_tanam: ReferenceMusimTanam[];
  provitas: SyncRecord[];
  luas_areal: SyncRecord[];
  server_time: string;
};

export type AppNotification = {
  id: string;
  type: string;
  data: {
    event: "master_data_added";
    title: string;
    message: string;
    resource_type: "desa" | "lahan";
    resource_id: string;
    kecamatan_id: string;
    desa_id: string | null;
    nama: string;
  };
  read_at: string | null;
  created_at: string;
};

export type NotificationsResponse = {
  data: AppNotification[];
  current_page: number;
  last_page: number;
  unread_count: number;
};

export type SyncResponse = {
  hasil: {
    provitas: {
      id: string;
      status: "diterima" | "ditolak";
      alasan: string | null;
      versi_server?: SyncRecord;
    }[];
    luas_areal: {
      id: string;
      status: "diterima" | "ditolak";
      alasan: string | null;
      versi_server?: SyncRecord;
    }[];
  };
  perubahan: {
    provitas: SyncRecord[];
    luas_areal: SyncRecord[];
  };
  server_time: string;
};

export type VerificationRecord = SyncRecord & {
  ppl?: Pick<User, "id" | "nama" | "email">;
  lahan?: {
    nama_petani: string;
    kode_sampel: string;
    desa?: {
      nama: string;
      kecamatan?: {
        nama: string;
      };
    };
  };
  desa?: {
    nama: string;
    kecamatan?: {
      nama: string;
    };
  };
  musim_tanam?: {
    nama: string;
  };
};

export type VerificationPage = {
  data: VerificationRecord[];
  current_page: number;
  last_page: number;
  total: number;
};

type LoginResponse = {
  token: string;
  user: User;
};

const tokenStorageKey = "sipadi_token";

export async function login(email: string, password: string) {
  return apiRequest<LoginResponse>("login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getCurrentUser(token: string) {
  const response = await apiRequest<User | { data: User }>("me", { token });
  return "data" in response ? response.data : response;
}

export async function getReferences(token: string) {
  return apiRequest<References>("referensi", { token });
}

export async function getPendingVerifications(
  token: string,
  type: "provitas" | "luas-areal",
  page = 1,
) {
  return apiRequest<VerificationPage>(
    `verifikasi/${type}?page=${page}`,
    { token },
  );
}

export async function reviewSubmission(
  token: string,
  type: "provitas" | "luas-areal",
  id: string,
  action: "setujui" | "tolak",
  catatanVerifikasi?: string,
) {
  return apiRequest<VerificationRecord>(
    `verifikasi/${type}/${id}/${action}`,
    {
      method: "POST",
      token,
      body: JSON.stringify({ catatan_verifikasi: catatanVerifikasi }),
    },
  );
}

export async function getNotifications(token: string) {
  return apiRequest<NotificationsResponse>("notifications", { token });
}

export async function markNotificationRead(token: string, id: string) {
  return apiRequest<{ data: AppNotification }>(`notifications/${id}/read`, {
    method: "POST",
    token,
  });
}

export async function markAllNotificationsRead(token: string) {
  return apiRequest<{ message: string }>("notifications/read-all", {
    method: "POST",
    token,
  });
}

export async function syncProvitas(
  token: string,
  records: SyncRecord[],
  lastSync: string | null,
  luasAreal: SyncRecord[] = [],
) {
  return apiRequest<SyncResponse>("sync", {
    method: "POST",
    token,
    body: JSON.stringify({
      provitas: records,
      luas_areal: luasAreal,
      last_sync: lastSync,
    }),
  });
}

export async function logout(token: string) {
  return apiRequest<{ message: string }>("logout", {
    method: "POST",
    token,
  });
}

export function readToken() {
  return window.sessionStorage.getItem(tokenStorageKey);
}

export function saveToken(token: string) {
  window.sessionStorage.setItem(tokenStorageKey, token);
}

export function clearToken() {
  window.sessionStorage.removeItem(tokenStorageKey);
}
