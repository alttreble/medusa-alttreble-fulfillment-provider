import { defineConfig } from "eslint/config"
import medusa from "@medusajs/eslint-plugin"

export default defineConfig([
  { ignores: ["src/generated/**"] },
  ...medusa.configs.recommended,
])
