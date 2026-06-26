/**
 * Speedy client.
 *
 * Thin adapter over the generated Speedy SDK (src/generated/speedy, produced by
 * `pnpm gen:clients` from openapi/speedy.yaml). Speedy is the carrier behind the
 * regional DPD-branded service — same API, different brand name per country —
 * which is why the spec is published under the dpd-sdk docs but modeled here as
 * `speedy`.
 *
 *   server:  https://api.speedy.bg/v1
 *   auth:    username/password are sent in each request body (not a header),
 *            so there is no per-instance auth on the client itself.
 */

import { createClient, createConfig } from "../../../../generated/speedy/client"
import { findOffice, type Office } from "../../../../generated/speedy"
import type { Client } from "../../../../generated/speedy/client"
import {
  CourierClient,
  ListOfficesParams,
  UnifiedOffice,
} from "../types"

export type SpeedyCredentials = {
  username: string
  password: string
}

export type SpeedyClientOptions = SpeedyCredentials & {
  /** Speedy exposes no separate sandbox host; kept for interface symmetry. */
  testMode?: boolean
}

const PRODUCTION_URL = "https://api.speedy.bg/v1"

/**
 * Speedy `countryId` is the ISO 3166-1 *numeric* code, while UnifiedOffice /
 * ListOfficesParams use the alpha-2 code. Map the countries Speedy serves; add
 * more entries here as coverage grows. An unmapped code falls back to Speedy's
 * default country (Bulgaria), matching the "omit countryId" behavior in the spec.
 */
const ISO_ALPHA2_TO_NUMERIC: Record<string, number> = {
  BG: 100,
  RO: 642,
  GR: 300,
}

export class SpeedyClient implements CourierClient {
  readonly provider = "speedy" as const

  private readonly client: Client
  private readonly username: string
  private readonly password: string

  constructor(options: SpeedyClientOptions) {
    this.username = options.username
    this.password = options.password
    // Per-account client so config never bleeds across tenants, even though
    // Speedy carries auth in the body rather than on the client.
    this.client = createClient(createConfig({ baseUrl: PRODUCTION_URL }))
  }

  async listOffices(params: ListOfficesParams = {}): Promise<UnifiedOffice[]> {
    const countryCode = (params.countryCode ?? "BG").toUpperCase()
    const countryId = ISO_ALPHA2_TO_NUMERIC[countryCode]

    const { data } = await findOffice({
      client: this.client,
      throwOnError: true,
      body: {
        userName: this.username,
        password: this.password,
        ...(countryId !== undefined ? { countryId } : {}),
        ...(params.cityId !== undefined ? { siteId: params.cityId } : {}),
      },
    })

    // Return the full list; free-text `search` is applied by the aggregation
    // layer so a single network result is reusable across many search terms.
    return (data.offices ?? []).map((o) => this.toUnifiedOffice(o, countryCode))
  }

  private toUnifiedOffice(office: Office, countryCode: string): UnifiedOffice {
    const address = office.address

    return {
      id: `${this.provider}:${office.id}`,
      provider: this.provider,
      // Speedy identifies offices by numeric id; that's what a label needs.
      code: office.id !== undefined ? String(office.id) : "",
      name: office.name ?? "",
      city: address?.siteName ?? "",
      address: address?.fullAddressString ?? "",
      postCode: address?.postCode,
      countryCode,
      // Speedy GIS coords: x = longitude, y = latitude.
      latitude: address?.y,
      longitude: address?.x,
      type: office.type === "APT" ? "aps" : "office",
    }
  }
}
