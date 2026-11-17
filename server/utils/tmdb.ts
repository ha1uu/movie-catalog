import { createHash } from "node:crypto";
import { EnvHttpProxyAgent, fetch as upstreamFetch } from "undici";

// Respect the cloud environment's proxy, NO_PROXY and certificate verification.
const dispatcher = new EnvHttpProxyAgent();
const cachedRequest = defineCachedFunction(
  async (path: string, query: Record<string, string | number>) => {
    const config = useRuntimeConfig();
    const url = new URL(`${config.tmdbApiBase.replace(/\/$/, "")}/${path}`);
    for (const [key, value] of Object.entries(query))
      url.searchParams.set(key, String(value));
    let response;
    try {
      response = await upstreamFetch(url, {
        headers: {
          Authorization: `Bearer ${config.tmdbReadToken.trim()}`,
          Accept: "application/json",
        },
        dispatcher,
        signal: AbortSignal.timeout(8000),
        redirect: "error",
      });
    } catch {
      throw createError({
        statusCode: 503,
        statusMessage: "Catalog service is unavailable",
        data: { code: "CATALOG_UNAVAILABLE" },
      });
    }
    if (!response.ok) {
      await response.body?.cancel();
      if (response.status === 404)
        throw createError({ statusCode: 404, statusMessage: "Not found" });
      if (response.status === 401 || response.status === 403)
        throw createError({
          statusCode: 502,
          statusMessage: "Catalog authentication failed",
          data: { code: "CATALOG_AUTH_FAILED" },
        });
      if (response.status === 429)
        throw createError({
          statusCode: 503,
          statusMessage: "Catalog rate limit reached",
          data: { code: "CATALOG_RATE_LIMITED" },
        });
      throw createError({
        statusCode: 502,
        statusMessage: "Catalog upstream error",
        data: { code: "CATALOG_UPSTREAM_ERROR" },
      });
    }
    try {
      return await response.json();
    } catch {
      throw createError({
        statusCode: 502,
        statusMessage: "Invalid catalog response",
      });
    }
  },
  {
    name: "tmdb-v1",
    maxAge: 300,
    swr: false,
    getKey: (path, query) => {
      const config = useRuntimeConfig();
      // Credentials never appear in URLs, logs or cache keys.
      return createHash("sha256")
        .update(
          JSON.stringify([
            config.tmdbApiBase,
            config.tmdbReadToken,
            path,
            Object.entries(query).sort(),
          ]),
        )
        .digest("hex");
    },
  },
);

export async function tmdbGet<T>(
  path: string,
  query: Record<string, string | number> = {},
): Promise<T> {
  if (!useRuntimeConfig().tmdbReadToken.trim())
    throw createError({
      statusCode: 503,
      statusMessage: "Catalog is not configured",
      data: { code: "CATALOG_NOT_CONFIGURED" },
    });
  return (await cachedRequest(path, { language: "ru-RU", ...query })) as T;
}

export function tmdbId(value: unknown): string {
  if (typeof value !== "string" || !/^[1-9]\d{0,9}$/.test(value))
    throw createError({ statusCode: 404, statusMessage: "Not found" });
  return value;
}
export function tmdbPage(value: unknown, max = 500): number {
  if (value === undefined || value === "") return 1;
  const page = Number(value);
  if (!Number.isSafeInteger(page) || page < 1 || page > max)
    throw createError({ statusCode: 400, statusMessage: "Invalid page" });
  return page;
}
export function tmdbImage(
  path: string | null | undefined,
  size = "w500",
): string | null {
  return path && /^\/[a-zA-Z0-9._-]+$/.test(path)
    ? `https://image.tmdb.org/t/p/${size}${path}`
    : null;
}
