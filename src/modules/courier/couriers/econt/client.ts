/**
 * Econt client.
 *
 * Thin adapter over the generated Econt SDK (src/generated/econt, produced by
 * `pnpm gen:clients` from openapi/econt.yaml). It owns only two things the
 * generated code can't: per-account configuration (base URL + Basic auth, since
 * credentials come from a stored CourierAccount, not a global singleton) and the
 * mapping from Econt's shapes into the courier-agnostic UnifiedOffice.
 *
 *   server:  https://ee.econt.com/services        (production)
 *            https://demo.econt.com/ee/services    (test / demo)
 *   auth:    HTTP Basic, applied as a header on the per-instance client
 */

import { createClient, createConfig } from "../../../../generated/econt/client"
import {
  postNomenclaturesNomenclaturesServiceGetOfficesJson,
  type Office,
} from "../../../../generated/econt"
import type { Client } from "../../../../generated/econt/client"
import {
  CourierClient,
  ListOfficesParams,
  UnifiedOffice,
} from "../types"

export type EcontCredentials = {
  username: string
  password: string
}

export type EcontClientOptions = EcontCredentials & {
  /** When true, hit the demo endpoint instead of production. */
  testMode?: boolean
}

const PRODUCTION_URL = "https://ee.econt.com/services"
const DEMO_URL = "https://demo.econt.com/ee/services"

export class EcontClient implements CourierClient {
  readonly provider = "econt" as const

  private readonly client: Client

  constructor(options: EcontClientOptions) {
    const baseUrl = options.testMode ? DEMO_URL : PRODUCTION_URL
    const token = Buffer.from(
      `${options.username}:${options.password}`
    ).toString("base64")

    // A dedicated client per account — never mutate the generated singleton,
    // which would leak one tenant's credentials into another's requests.
    this.client = createClient(
      createConfig({
        baseUrl,
        headers: { Authorization: `Basic ${token}` },
      })
    )
  }

  async listOffices(params: ListOfficesParams = {}): Promise<UnifiedOffice[]> {
    const { data } = await postNomenclaturesNomenclaturesServiceGetOfficesJson({
      client: this.client,
      throwOnError: true,
      body: {
        countryCode: params.countryCode ?? "BG",
        ...(params.cityId !== undefined ? { cityID: params.cityId } : {}),
      },
    })

    // Return the full list for this (country, city); free-text `search` is
    // applied by the aggregation layer so the result can be cached once and
    // filtered cheaply across many search terms.
    return (data.offices ?? []).map((o) => this.toUnifiedOffice(o))
  }

  private toUnifiedOffice(office: Office): UnifiedOffice {
    const address = office.address
    const city = address?.city

    return {
      id: `${this.provider}:${office.code}`,
      provider: this.provider,
      code: office.code ?? "",
      name: office.name ?? "",
      city: city?.name ?? "",
      address: address?.fullAddress ?? "",
      postCode: address?.zip ?? city?.postCode,
      countryCode: city?.country?.code2,
      latitude: address?.location?.latitude,
      longitude: address?.location?.longitude,
      phones: office.phones,
      type: office.isAPS ? "aps" : office.isMPS ? "mps" : "office",
    }
  }
}
