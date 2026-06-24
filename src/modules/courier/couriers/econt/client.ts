/**
 * Self-contained Econt client.
 *
 * Modeled directly from econt-sdk/openapi.yaml — we do NOT depend on the
 * external econt-sdk package. Only the endpoints this plugin needs are
 * implemented; extend as the fulfillment-provider work grows.
 *
 *   server:  https://ee.econt.com/services        (production)
 *            https://demo.econt.com/ee/services    (test / demo)
 *   auth:    HTTP Basic (base64), applied globally per the spec
 */

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

// --- openapi.yaml: schemas relevant to getOffices -------------------------

type EcontGeoLocation = {
  latitude?: number
  longitude?: number
  confidence?: number
}

type EcontCountry = {
  id?: number
  code2?: string
  code3?: string
  name?: string
  nameEn?: string
}

type EcontCity = {
  id?: number
  country?: EcontCountry
  postCode?: string
  name?: string
  nameEn?: string
}

type EcontAddress = {
  id?: number
  city?: EcontCity
  fullAddress?: string
  fullAddressEn?: string
  quarter?: string
  street?: string
  num?: string
  other?: string
  location?: EcontGeoLocation
  zip?: string
}

type EcontOffice = {
  id: number
  code: string
  isMPS?: boolean
  isAPS?: boolean
  name: string
  nameEn?: string
  phones?: string[]
  emails?: string[]
  address?: EcontAddress
  info?: string
  currency?: string
  language?: string
}

type GetOfficesRequest = {
  countryCode?: string
  cityID?: number
  showCargoReceptions?: boolean
  showLC?: boolean
  servingReceptions?: boolean
}

type GetOfficesResponse = {
  offices?: EcontOffice[]
}

const PRODUCTION_URL = "https://ee.econt.com/services"
const DEMO_URL = "https://demo.econt.com/ee/services"

export class EcontClient implements CourierClient {
  readonly provider = "econt" as const

  private readonly baseUrl: string
  private readonly authHeader: string

  constructor(options: EcontClientOptions) {
    this.baseUrl = options.testMode ? DEMO_URL : PRODUCTION_URL
    const token = Buffer.from(
      `${options.username}:${options.password}`
    ).toString("base64")
    this.authHeader = `Basic ${token}`
  }

  async listOffices(params: ListOfficesParams = {}): Promise<UnifiedOffice[]> {
    const body: GetOfficesRequest = {
      countryCode: params.countryCode ?? "BG",
    }
    if (params.cityId !== undefined) {
      body.cityID = params.cityId
    }

    const res = await this.request<GetOfficesResponse>(
      "Nomenclatures/NomenclaturesService.getOffices.json",
      body
    )

    const offices = (res.offices ?? []).map((o) => this.toUnifiedOffice(o))

    if (!params.search) {
      return offices
    }

    const needle = params.search.trim().toLowerCase()
    return offices.filter((o) =>
      [o.name, o.city, o.address].some((field) =>
        field?.toLowerCase().includes(needle)
      )
    )
  }

  private toUnifiedOffice(office: EcontOffice): UnifiedOffice {
    const address = office.address
    const city = address?.city

    return {
      id: `${this.provider}:${office.code}`,
      provider: this.provider,
      code: office.code,
      name: office.name,
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

  private async request<T>(path: string, body: object): Promise<T> {
    const response = await fetch(`${this.baseUrl}/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: this.authHeader,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => "")
      throw new Error(
        `Econt API error (${response.status} ${response.statusText}) on ${path}: ${text}`
      )
    }

    return (await response.json()) as T
  }
}
