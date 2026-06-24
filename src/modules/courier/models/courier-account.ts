import { model } from "@medusajs/framework/utils"

/**
 * Stores per-courier configuration so credentials are managed from the
 * Medusa admin UI (DB-backed) instead of static env vars / provider options.
 *
 * One row per courier `provider`. `credentials` is provider-specific JSON
 * (e.g. Econt: { username, password }); keeping it as JSON lets each courier
 * carry whatever auth shape its API needs without schema churn.
 */
const CourierAccount = model.define("courier_account", {
  id: model.id().primaryKey(),
  // "econt" | "speedy" — one account per provider.
  provider: model.text().unique(),
  // Human-friendly name shown in the admin (e.g. "Econt Express").
  label: model.text().nullable(),
  // Disabled accounts are skipped by the offices aggregation.
  is_enabled: model.boolean().default(false),
  // Hit the courier's demo/test endpoint instead of production.
  test_mode: model.boolean().default(true),
  // Provider-specific secrets, e.g. { username, password }.
  credentials: model.json().nullable(),
})

export default CourierAccount
