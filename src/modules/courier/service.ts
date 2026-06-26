import { MedusaService } from "@medusajs/framework/utils"
import { Logger } from "@medusajs/framework/types"
import CourierAccount from "./models/courier-account"
import { buildCourierClient } from "./couriers/registry"
import { ListOfficesParams, UnifiedOffice } from "./couriers/types"
import { filterOfficesBySearch } from "./couriers/search"

type InjectedDependencies = {
  logger: Logger
}

/**
 * CourierModuleService
 *
 * MedusaService auto-generates CRUD for CourierAccount
 * (createCourierAccounts, listCourierAccounts, updateCourierAccounts, ...).
 *
 * On top of that it owns the courier-integration reads: building clients from
 * stored accounts and aggregating offices across every enabled courier. These
 * are reads against external APIs (no DB mutation), so they live here and are
 * called directly from GET routes — workflows are reserved for mutations.
 */
class CourierModuleService extends MedusaService({
  CourierAccount,
}) {
  protected logger_: Logger

  constructor(...args: [InjectedDependencies, ...any[]]) {
    super(...args)
    this.logger_ = args[0].logger
  }

  /**
   * Aggregate offices from all enabled couriers (optionally a single one).
   * A failing courier degrades gracefully — its offices are omitted rather
   * than failing the whole request.
   */
  async listOffices(
    params: ListOfficesParams & { provider?: string } = {}
  ): Promise<UnifiedOffice[]> {
    const filters: Record<string, unknown> = { is_enabled: true }
    if (params.provider) {
      filters.provider = params.provider
    }

    const accounts = await this.listCourierAccounts(filters)

    const results = await Promise.all(
      accounts.map(async (account) => {
        try {
          const client = buildCourierClient({
            provider: account.provider,
            test_mode: account.test_mode,
            credentials: account.credentials as Record<string, unknown> | null,
          })
          return await client.listOffices(params)
        } catch (e) {
          this.logger_.error(
            `[courier] Failed to list offices for "${account.provider}": ${
              (e as Error).message
            }`
          )
          return [] as UnifiedOffice[]
        }
      })
    )

    return filterOfficesBySearch(results.flat(), params.search)
  }
}

export default CourierModuleService
