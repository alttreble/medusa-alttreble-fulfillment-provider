import { defineConfig } from "@hey-api/openapi-ts"

/**
 * Codegen for the courier HTTP clients.
 *
 * The OpenAPI specs live in ./openapi and are vendored from the published
 * Scalar docs:
 *   - econt.yaml  <- https://alttreble.github.io/econt-sdk/openapi.yaml
 *   - speedy.yaml <- https://alttreble.github.io/dpd-sdk/openapi.yaml  (titled
 *                    "Speedy Web API"; the DPD docs site serves the Speedy spec)
 *
 * Regenerate with `pnpm gen:clients`. The generated code lands in
 * src/generated/<courier> and is committed so consumers don't need the spec at
 * build time. Hand-written adapters (couriers/<courier>/client.ts) map the
 * generated SDK into the courier-agnostic UnifiedOffice types.
 */
export default defineConfig([
  {
    input: { path: "./openapi/econt.yaml" },
    output: "src/generated/econt",
    plugins: ["@hey-api/client-fetch", "@hey-api/typescript", "@hey-api/sdk"],
  },
  {
    input: { path: "./openapi/speedy.yaml" },
    output: "src/generated/speedy",
    plugins: ["@hey-api/client-fetch", "@hey-api/typescript", "@hey-api/sdk"],
  },
])
