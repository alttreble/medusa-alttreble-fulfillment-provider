/**
 * Shared, courier-agnostic types.
 *
 * Every courier (Econt now, Speedy/DPD later) implements `CourierClient`,
 * mapping its own API shapes into these unified types so the rest of the
 * plugin — the aggregation service, the store API, the storefront — never
 * needs to know which courier an office came from.
 */

export type CourierProvider = "econt" | "speedy"

/** A pickup location, normalized across couriers. */
export type UnifiedOffice = {
  /** Globally unique id: `${provider}:${code}` */
  id: string
  provider: CourierProvider
  /** Courier-native office code (used when creating a label). */
  code: string
  name: string
  city: string
  address: string
  postCode?: string
  /** ISO 3166-1 alpha-2 (e.g. "BG"). */
  countryCode?: string
  latitude?: number
  longitude?: number
  phones?: string[]
  /** office | aps (automated parcel station) | mps (mobile parcel station) */
  type: "office" | "aps" | "mps"
}

export type ListOfficesParams = {
  /** ISO 3166-1 alpha-2 country code. Defaults to "BG". */
  countryCode?: string
  /** Courier-native city id, when the caller already resolved one. */
  cityId?: number
  /** Free-text filter applied to name / city / address. */
  search?: string
}

/**
 * Contract every courier integration must satisfy. Keep this intentionally
 * small — add capabilities (calculatePrice, createLabel, ...) only as the
 * fulfillment-provider work needs them.
 */
export interface CourierClient {
  readonly provider: CourierProvider
  listOffices(params: ListOfficesParams): Promise<UnifiedOffice[]>
}
