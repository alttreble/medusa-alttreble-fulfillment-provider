import { MiddlewareRoute, validateAndTransformBody } from "@medusajs/framework"
import { z } from "zod"

/**
 * Credentials are provider-specific JSON. For Econt the shape is
 * { username, password }; we keep it permissive so other couriers can carry
 * their own auth fields without a schema change.
 */
export const UpsertCourierBody = z.object({
  provider: z.string().min(1),
  label: z.string().nullish(),
  is_enabled: z.boolean().optional(),
  test_mode: z.boolean().optional(),
  credentials: z.record(z.string(), z.any()).nullish(),
})

export type UpsertCourierBody = z.infer<typeof UpsertCourierBody>

export const adminCourierMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/couriers",
    method: "POST",
    // Cast: local zod (3.25.x) is newer than the version @medusajs/framework
    // was built against, so the ZodObject types are nominally incompatible.
    // Runtime validation and the inferred body type are unaffected.
    middlewares: [validateAndTransformBody(UpsertCourierBody as any)],
  },
]
