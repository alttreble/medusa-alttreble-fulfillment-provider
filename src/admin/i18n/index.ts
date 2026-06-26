import en from "./json/en.json" with { type: "json" }
import bg from "./json/bg.json" with { type: "json" }

/**
 * Translations for this plugin's admin extensions.
 *
 * Medusa's admin build crawls `src/admin/i18n/index.ts` and registers this
 * default export as the plugin's `i18nModule`, which the dashboard deep-merges
 * into its shared i18next instance. Our strings then follow whatever language
 * the user selects in Settings → Profile → Language.
 *
 * Bulgarian (`bg`) is a built-in dashboard language, so no extra wiring is
 * needed. We use a dedicated `couriers` namespace to avoid key collisions with
 * the dashboard's core `translation` namespace — consume it with
 * `useTranslation("couriers")`.
 */
export default {
  en: { couriers: en },
  bg: { couriers: bg },
}
