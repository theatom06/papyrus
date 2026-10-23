export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);
  const payload = (await response.json().catch(() => null)) as
    (T & { error?: string }) | null;
  if (!response.ok) {
    throw new ApiError(
      payload && typeof payload.error === "string"
        ? payload.error
        : `Request failed with status ${response.status}.`,
      response.status,
    );
  }
  return payload as T;
}
