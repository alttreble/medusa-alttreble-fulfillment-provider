/**
 * Maps a stored courier account into a concrete `CourierClient`.
 *
 * This is the single place to wire in a new courier: implement a client,
 * then add a case here. Everything else (service aggregation, store API)
 * stays untouched.
 */

import { CourierClient, CourierProvider } from "./types"
import { EcontClient } from "./econt/client"

export type CourierAccountConfig = {
  provider: CourierProvider | string
  test_mode: boolean
  credentials: Record<string, unknown> | null
}

export function buildCourierClient(
  account: CourierAccountConfig
): CourierClient {
  switch (account.provider) {
    case "econt": {
      const creds = account.credentials ?? {}
      const username = creds.username
      const password = creds.password

      if (typeof username !== "string" || typeof password !== "string") {
        throw new Error(
          `Econt account is missing "username"/"password" credentials`
        )
      }

      return new EcontClient({
        username,
        password,
        testMode: account.test_mode,
      })
    }

    // case "speedy": return new SpeedyClient(...)  // added later

    default:
      throw new Error(
        `No courier client registered for provider "${account.provider}"`
      )
  }
}
