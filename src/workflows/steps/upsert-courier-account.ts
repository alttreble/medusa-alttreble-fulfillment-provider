import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { COURIER_MODULE } from "../../modules/courier"
import CourierModuleService from "../../modules/courier/service"
import { invalidateOfficesCache } from "../../modules/courier/couriers/offices-cache"

export type UpsertCourierAccountInput = {
  provider: string
  label?: string | null
  is_enabled?: boolean
  test_mode?: boolean
  credentials?: Record<string, unknown> | null
}

type CompensationData =
  | { action: "create"; id: string }
  | { action: "update"; previous: Record<string, unknown> }

/**
 * Upserts a single courier account keyed by `provider`.
 * Compensation deletes a freshly-created row or restores the prior values.
 */
export const upsertCourierAccountStep = createStep(
  "upsert-courier-account",
  async (input: UpsertCourierAccountInput, { container }) => {
    const service: CourierModuleService = container.resolve(COURIER_MODULE)

    const [existing] = await service.listCourierAccounts({
      provider: input.provider,
    })

    // Only persist fields that were actually provided (partial update).
    const data: Record<string, unknown> = { provider: input.provider }
    if (input.label !== undefined) data.label = input.label
    if (input.is_enabled !== undefined) data.is_enabled = input.is_enabled
    if (input.test_mode !== undefined) data.test_mode = input.test_mode
    if (input.credentials !== undefined) {
      // Merge onto existing credentials so the admin form can omit unchanged
      // secrets (e.g. leave password blank to keep the stored one).
      const prevCredentials =
        (existing?.credentials as Record<string, unknown> | null) ?? {}
      data.credentials = existing
        ? { ...prevCredentials, ...input.credentials }
        : input.credentials
    }

    if (existing) {
      const previous = {
        id: existing.id,
        label: existing.label,
        is_enabled: existing.is_enabled,
        test_mode: existing.test_mode,
        credentials: existing.credentials,
      }
      const updated = await service.updateCourierAccounts({
        id: existing.id,
        ...data,
      })
      // Credentials / test_mode / enabled changes affect the office list.
      await invalidateOfficesCache(container.resolve(Modules.CACHE))
      return new StepResponse(updated, {
        action: "update",
        previous,
      } satisfies CompensationData)
    }

    const created = await service.createCourierAccounts(data)
    await invalidateOfficesCache(container.resolve(Modules.CACHE))
    return new StepResponse(created, {
      action: "create",
      id: created.id,
    } satisfies CompensationData)
  },
  async (compensation: CompensationData | undefined, { container }) => {
    if (!compensation) return
    const service: CourierModuleService = container.resolve(COURIER_MODULE)

    if (compensation.action === "create") {
      await service.deleteCourierAccounts(compensation.id)
    } else {
      await service.updateCourierAccounts(compensation.previous)
    }
  }
)
