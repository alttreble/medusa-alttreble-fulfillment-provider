import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { COURIER_MODULE } from "../../../../modules/courier"
import CourierModuleService from "../../../../modules/courier/service"
import { GetOfficesQuery } from "./middlewares"

/**
 * GET /store/couriers/offices
 *
 * Returns the aggregated pickup-office list across every enabled courier
 * (Econt for now). The storefront checkout uses this to let the customer
 * pick an office; the chosen office `code` is later stored on the cart's
 * shipping method.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { country_code, provider, city_id, q } =
    req.validatedQuery as GetOfficesQuery

  const service: CourierModuleService = req.scope.resolve(COURIER_MODULE)

  const offices = await service.listOffices({
    countryCode: country_code,
    provider,
    cityId: city_id,
    search: q,
  })

  res.json({ offices, count: offices.length })
}
