export const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"
).replace(/\/+$/, "");

type ApiRequestOptions = Omit<RequestInit, "headers"> & {
  headers?: HeadersInit;
  token?: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { token, headers: requestHeaders, ...requestOptions } = options;
  const headers = new Headers(requestHeaders);

  headers.set("Accept", "application/json");

  if (requestOptions.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}/${path.replace(/^\/+/, "")}`, {
      ...requestOptions,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      "Tidak dapat terhubung ke server. Periksa koneksi atau alamat API.",
      0,
    );
  }

  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    const validationMessage = responseBody?.errors
      ? Object.values(responseBody.errors).flat().find(Boolean)
      : null;

    throw new ApiError(
      validationMessage ??
        responseBody?.message ??
        "Terjadi kesalahan saat menghubungi server.",
      response.status,
    );
  }

  return responseBody as T;
}
