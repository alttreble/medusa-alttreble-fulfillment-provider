import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  upsertCourierAccountStep,
  UpsertCourierAccountInput,
} from "./steps/upsert-courier-account"

export const upsertCourierAccountWorkflow = createWorkflow(
  "upsert-courier-account",
  function (input: UpsertCourierAccountInput) {
    const account = upsertCourierAccountStep(input)
    return new WorkflowResponse(account)
  }
)

export default upsertCourierAccountWorkflow
