/** Tiny fetch wrapper for the app's own JSON API. Never throws. */
export type ApiResult<T = unknown> = { ok: true; data: T } | { ok: false; error: string; status: number; blocked?: string[] };

export async function api<T = unknown>(method: "GET" | "POST" | "PATCH" | "DELETE", url: string, body?: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
    const json = (await res.json().catch(() => ({}))) as { data?: T; orders?: T; error?: string; blocked?: string[]; ok?: boolean };
    if (!res.ok || json.ok === false) {
      return { ok: false, error: json.error ?? "Something went wrong. Try again.", status: res.status, blocked: json.blocked };
    }
    // POST /api/orders answers { ok, orders }.
    return { ok: true, data: (json.data ?? json.orders) as T };
  } catch {
    return { ok: false, error: "Could not reach the server. Check your connection.", status: 0 };
  }
}
