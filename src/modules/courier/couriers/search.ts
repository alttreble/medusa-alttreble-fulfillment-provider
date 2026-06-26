import { UnifiedOffice } from "./types"

/**
 * In-memory free-text filter over office name / city / address.
 *
 * Kept separate from the network fetch so the full per-(country, city) office
 * list can be cached once and then filtered cheaply per search term — search
 * variations never trigger a courier API call.
 */
export function filterOfficesBySearch(
  offices: UnifiedOffice[],
  search?: string
): UnifiedOffice[] {
  const needle = search?.trim().toLowerCase()
  if (!needle) {
    return offices
  }

  return offices.filter((o) =>
    [o.name, o.city, o.address].some((field) =>
      field?.toLowerCase().includes(needle)
    )
  )
}
