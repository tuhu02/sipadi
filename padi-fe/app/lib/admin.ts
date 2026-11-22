import { apiRequest } from "@/app/lib/api";

export type AdminResource =
  | "users"
  | "kecamatan"
  | "desa"
  | "lahan"
  | "provitas"
  | "luas-areal"
  | "musim-tanam"
  | "penugasan";

export type AdminRecord = {
  id: string;
  [key: string]: unknown;
};

type PaginatedResponse<T> = {
  data: T[];
  current_page: number;
  last_page: number;
};

export async function getAdminRecords<T extends AdminRecord>(
  token: string,
  resource: AdminResource,
): Promise<T[]> {
  const records: T[] = [];
  let page = 1;
  let lastPage = 1;

  do {
    const response = await apiRequest<PaginatedResponse<T>>(
      `${resource}?per_page=100&page=${page}`,
      { token },
    );
    records.push(...response.data);
    lastPage = response.last_page;
    page += 1;
  } while (page <= lastPage);

  return records;
}

export function createAdminRecord(
  token: string,
  resource: AdminResource,
  data: Record<string, string | number>,
) {
  return apiRequest<AdminRecord>(resource, {
    method: "POST",
    token,
    body: JSON.stringify(data),
  });
}

export function updateAdminRecord(
  token: string,
  resource: AdminResource,
  id: string,
  data: Record<string, string | number>,
) {
  return apiRequest<AdminRecord>(`${resource}/${encodeURIComponent(id)}`, {
    method: "PUT",
    token,
    body: JSON.stringify(data),
  });
}

export function deleteAdminRecord(
  token: string,
  resource: AdminResource,
  id: string,
) {
  return apiRequest<void>(`${resource}/${encodeURIComponent(id)}`, {
    method: "DELETE",
    token,
  });
}
