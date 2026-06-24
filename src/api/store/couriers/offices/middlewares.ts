import {
  MiddlewareRoute,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import { z } from "zod"

const toNumber = (val: unknown) =>
  typeof val === "string" && val.length ? parseInt(val, 10) : val

export const GetOfficesQuery = z.object({
  // ISO 3166-1 alpha-2; defaults to BG inside the courier client.
  country_code: z.string().length(2).optional(),
  // Restrict to a single courier (e.g. "econt"); omit to aggregate all.
  provider: z.string().optional(),
  // Courier-native city id.
  city_id: z.preprocess(toNumber, z.number().int().positive().optional()),
  // Free-text filter over office name / city / address.
  q: z.string().optional(),
})

export type GetOfficesQuery = z.infer<typeof GetOfficesQuery>

export const storeOfficesMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/couriers/offices",
    method: "GET",
    // Cast: see admin/couriers/middlewares.ts — local zod is newer than the
    // version @medusajs/framework was built against.
    middlewares: [validateAndTransformQuery(GetOfficesQuery as any, {})],
  },
]
