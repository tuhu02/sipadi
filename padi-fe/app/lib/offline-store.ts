import type { References, SyncRecord } from "@/app/lib/auth";

export type LocalProvitas = SyncRecord & {
  lahan_id: string;
  musim_tanam_id: string;
  tanggal_panen: string;
  luas_petak_m2: number;
  berat_gabah_kg: number;
  kadar_air: number | null;
  catatan: string | null;
  provitas_kuha: number;
  sync_error: string | null;
};

export type LocalLuasAreal = SyncRecord & {
  desa_id: string;
  tahun: number;
  bulan: number;
  luas_tanam_ha: number;
  luas_panen_ha: number;
  luas_puso_ha: number | null;
  catatan: string | null;
  sync_error: string | null;
};

type Metadata = {
  key: string;
  value: string;
};

const databaseName = "sipadi-offline";
const databaseVersion = 3;
const provitasStoreName = "provitas";
const luasArealStoreName = "luas_areal";
const metadataStoreName = "metadata";
const referencesStoreName = "references";

function openDatabase(userId: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(`${databaseName}-${userId}`, databaseVersion);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(provitasStoreName)) {
        database.createObjectStore(provitasStoreName, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(luasArealStoreName)) {
        database.createObjectStore(luasArealStoreName, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(metadataStoreName)) {
        database.createObjectStore(metadataStoreName, { keyPath: "key" });
      }
      if (!database.objectStoreNames.contains(referencesStoreName)) {
        database.createObjectStore(referencesStoreName, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Database lokal gagal dibuka."));
    request.onblocked = () =>
      reject(new Error("Database lokal sedang digunakan tab lain."));
  });
}

async function transact<T>(
  userId: string,
  storeName: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const database = await openDatabase(userId);

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const request = operation(transaction.objectStore(storeName));
    let result: T;

    request.onsuccess = () => {
      result = request.result;
    };
    request.onerror = () =>
      reject(request.error ?? new Error("Operasi penyimpanan lokal gagal."));
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error("Penyimpanan lokal dibatalkan."));
    };
    transaction.oncomplete = () => {
      database.close();
      resolve(result);
    };
  });
}

export async function getLocalProvitas(userId: string): Promise<LocalProvitas[]> {
  return transact(userId, provitasStoreName, "readonly", (store) => store.getAll());
}

export async function saveLocalProvitas(
  userId: string,
  record: LocalProvitas,
): Promise<void> {
  await transact(userId, provitasStoreName, "readwrite", (store) => store.put(record));
}

export async function getLocalLuasAreal(userId: string): Promise<LocalLuasAreal[]> {
  return transact(userId, luasArealStoreName, "readonly", (store) => store.getAll());
}

export async function saveLocalLuasAreal(
  userId: string,
  record: LocalLuasAreal,
): Promise<void> {
  await transact(userId, luasArealStoreName, "readwrite", (store) =>
    store.put(record),
  );
}

export async function getCachedReferences(
  userId: string,
): Promise<References | null> {
  const cached = await transact<{ key: string; value: References } | undefined>(
    userId,
    referencesStoreName,
    "readonly",
    (store) => store.get("references"),
  );

  return cached?.value ?? null;
}

export async function saveCachedReferences(
  userId: string,
  references: References,
): Promise<void> {
  await transact(userId, referencesStoreName, "readwrite", (store) =>
    store.put({ key: "references", value: references }),
  );
}

export async function updateProvitasAfterSync(
  userId: string,
  records: LocalProvitas[],
  result: {
    id: string;
    status: "diterima" | "ditolak";
    alasan: string | null;
    versi_server?: SyncRecord;
  }[],
  serverChanges: SyncRecord[],
  serverTime: string,
): Promise<void> {
  const database = await openDatabase(userId);

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(provitasStoreName, "readwrite");
    const store = transaction.objectStore(provitasStoreName);
    const serverById = new Map(serverChanges.map((record) => [record.id, record]));
    const resultById = new Map(result.map((item) => [item.id, item]));

    for (const localRecord of records) {
      const syncResult = resultById.get(localRecord.id);
      const serverRecord = serverById.get(localRecord.id) ?? syncResult?.versi_server;

      if (syncResult?.status === "ditolak") {
        store.put({
          ...(syncResult.versi_server ?? localRecord),
          sync_error: syncResult.alasan ?? "Record ditolak oleh server.",
        });
        continue;
      }

      if (serverRecord) {
        store.put({ ...serverRecord, sync_error: null });
      } else if (syncResult?.status === "diterima") {
        store.put({
          ...localRecord,
          synced_at: serverTime,
          sync_error: null,
        });
      }
    }

    for (const [id, record] of serverById) {
      if (!records.some((localRecord) => localRecord.id === id)) {
        store.put({ ...record, sync_error: null });
      }
    }

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error("Gagal memperbarui hasil sinkronisasi."));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error("Penyimpanan sinkronisasi dibatalkan."));
    };
  });
}

export async function updateLuasArealAfterSync(
  userId: string,
  records: LocalLuasAreal[],
  result: {
    id: string;
    status: "diterima" | "ditolak";
    alasan: string | null;
    versi_server?: SyncRecord;
  }[],
  serverChanges: SyncRecord[],
  serverTime: string,
): Promise<void> {
  const database = await openDatabase(userId);

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(luasArealStoreName, "readwrite");
    const store = transaction.objectStore(luasArealStoreName);
    const serverById = new Map(serverChanges.map((record) => [record.id, record]));
    const resultById = new Map(result.map((item) => [item.id, item]));

    for (const localRecord of records) {
      const syncResult = resultById.get(localRecord.id);
      const serverRecord =
        serverById.get(localRecord.id) ?? syncResult?.versi_server;

      if (syncResult?.status === "ditolak") {
        store.put({
          ...(syncResult.versi_server ?? localRecord),
          sync_error: syncResult.alasan ?? "Laporan ditolak oleh server.",
        });
        continue;
      }

      if (serverRecord) {
        store.put({ ...serverRecord, sync_error: null });
      } else if (syncResult?.status === "diterima") {
        store.put({
          ...localRecord,
          synced_at: serverTime,
          sync_error: null,
        });
      }
    }

    for (const [id, record] of serverById) {
      if (!records.some((localRecord) => localRecord.id === id)) {
        store.put({ ...record, sync_error: null });
      }
    }

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(
        transaction.error ??
          new Error("Gagal memperbarui hasil sinkronisasi luas areal."),
      );
    };
    transaction.onabort = () => {
      database.close();
      reject(
        transaction.error ??
          new Error("Penyimpanan sinkronisasi luas areal dibatalkan."),
      );
    };
  });
}

export async function getLastSync(userId: string): Promise<string | null> {
  const metadata = await transact<Metadata | undefined>(
    userId,
    metadataStoreName,
    "readonly",
    (store) => store.get("last_sync"),
  );

  return metadata?.value ?? null;
}

export async function saveLastSync(userId: string, value: string): Promise<void> {
  await transact(userId, metadataStoreName, "readwrite", (store) =>
    store.put({ key: "last_sync", value }),
  );
}
