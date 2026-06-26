import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import type { ICacheService } from "@medusajs/framework/types"
import { COURIER_MODULE } from "../../../../modules/courier"
import CourierModuleService from "../../../../modules/courier/service"
import { UnifiedOffice } from "../../../../modules/courier/couriers/types"
import { filterOfficesBySearch } from "../../../../modules/courier/couriers/search"
import {
  OFFICES_CACHE_TTL,
  officesCacheKey,
} from "../../../../modules/courier/couriers/offices-cache"
import { GetOfficesQuery } from "./middlewares"

/**
 * GET /store/couriers/offices
 *
 * Returns the aggregated pickup-office list across every enabled courier
 * (Econt and Speedy). The storefront checkout uses this to let the customer
 * pick an office; the chosen office `code` is later stored on the cart's
 * shipping method.
 *
 * The per-(provider, country, city) list is cached hard (see OFFICES_CACHE_TTL)
 * so the courier API is not hit on every request — offices change rarely, and
 * saving a courier account busts the cache. The free-text `q` filter is applied
 * in memory after the cache read, so search terms never trigger a network call.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { country_code, provider, city_id, q } =
    req.validatedQuery as GetOfficesQuery

  const service: CourierModuleService = req.scope.resolve(COURIER_MODULE)
  const cache: ICacheService = req.scope.resolve(Modules.CACHE)

  const cacheKey = await officesCacheKey(cache, {
    provider,
    countryCode: country_code,
    cityId: city_id,
  })

  let offices = await cache.get<UnifiedOffice[]>(cacheKey)
  if (!offices) {
    // Fetch the full list (no search) so it stays reusable across search terms.
    offices = await service.listOffices({
      countryCode: country_code,
      provider,
      cityId: city_id,
    })
    await cache.set(cacheKey, offices, OFFICES_CACHE_TTL)
  }

  const filtered = filterOfficesBySearch(offices, q)

  res.json({ offices: filtered, count: filtered.length })
}
