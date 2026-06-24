import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { COURIER_MODULE } from "../../../modules/courier"
import CourierModuleService from "../../../modules/courier/service"
import { upsertCourierAccountWorkflow } from "../../../workflows/upsert-courier-account"
import { UpsertCourierBody } from "./middlewares"

/**
 * Strip secrets before sending an account to the admin UI. The form never
 * needs the stored password back — it only needs to know whether one is set.
 */
function toSafeAccount(account: any) {
  const credentials = (account.credentials ?? {}) as Record<string, unknown>
  const { password, ...rest } = credentials
  return {
    id: account.id,
    provider: account.provider,
    label: account.label,
    is_enabled: account.is_enabled,
    test_mode: account.test_mode,
    credentials: rest,
    password_set: Boolean(password),
  }
}

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const service: CourierModuleService = req.scope.resolve(COURIER_MODULE)
  const accounts = await service.listCourierAccounts({})
  res.json({ couriers: accounts.map(toSafeAccount) })
}

export async function POST(
  req: AuthenticatedMedusaRequest<UpsertCourierBody>,
  res: MedusaResponse
) {
  const { result } = await upsertCourierAccountWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  res.json({ courier: toSafeAccount(result) })
}
