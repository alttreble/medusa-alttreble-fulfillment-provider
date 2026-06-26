import type { ICacheService } from "@medusajs/framework/types"

/**
 * Caching for the aggregated courier office list.
 *
 * Office lists change very rarely, so we cache the *pre-search* network result
 * hard and only re-fetch from the courier API after the TTL expires or after a
 * courier account is saved (see `invalidateOfficesCache`).
 *
 * Invalidation uses a monotonic version baked into the cache key rather than
 * pattern-deleting keys: bumping the version makes every existing entry
 * unreachable in one write, and works the same on in-memory and Redis backends
 * (whose `invalidate` glob support differs).
 */

/** 7 days — offices change rarely; admin saves bust the cache anyway. */
export const OFFICES_CACHE_TTL = 60 * 60 * 24 * 7

/** Version key must outlive office entries so it never resets under live data. */
const VERSION_TTL = 60 * 60 * 24 * 365
const VERSION_KEY = "courier-offices:version"

async function getVersion(cache: ICacheService): Promise<number> {
  const v = await cache.get<number>(VERSION_KEY)
  return typeof v === "number" ? v : 0
}

export type OfficesCacheKeyParts = {
  provider?: string
  countryCode?: string
  cityId?: number
}

/** Build the version-scoped cache key for a given office query. */
export async function officesCacheKey(
  cache: ICacheService,
  parts: OfficesCacheKeyParts
): Promise<string> {
  const version = await getVersion(cache)
  const provider = parts.provider ?? "all"
  const country = (parts.countryCode ?? "BG").toUpperCase()
  const city = parts.cityId ?? "all"
  return `courier-offices:v${version}:${provider}:${country}:${city}`
}

/**
 * Invalidate every cached office list by bumping the version. Call after any
 * change that can affect offices (credentials, test_mode, enabled toggle).
 */
export async function invalidateOfficesCache(
  cache: ICacheService
): Promise<void> {
  const version = await getVersion(cache)
  await cache.set(VERSION_KEY, version + 1, VERSION_TTL)
}
