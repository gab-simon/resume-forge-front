import type { AuthenticationSessionResource } from "@/api/generated"
import {
  authenticationLogout,
  authenticationRefreshAuthenticationSession,
} from "@/api/generated"

/** Tokens kept between page loads. */
export interface StoredSession {
  accessToken: string
  /** ISO 8601 instant when the access token stops working. */
  accessExpiresAt: string
  refreshToken: string
}

/**
 * Where the session lives. The browser implementation uses localStorage and is
 * created in src/main.tsx, so this file stays free of browser APIs.
 */
export interface SessionStorage {
  get: () => StoredSession | null
  set: (session: StoredSession) => void
  clear: () => void
}

export interface AuthSession {
  /** Fixed identifier of this browser or app installation. */
  readonly deviceId: string
  isAuthenticated: () => boolean
  /**
   * Returns an access token that is still valid, refreshing it first when it
   * expires within REFRESH_MARGIN_MS. Returns undefined without a session or
   * when the refresh fails, which also ends the session.
   */
  getAccessToken: () => Promise<string | undefined>
  signIn: (issued: AuthenticationSessionResource) => void
  /** Revokes the session on the back end, then forgets it locally. */
  signOut: () => Promise<void>
  /** Forgets the session without calling the back end. */
  clear: () => void
}

interface AuthSessionOptions {
  storage: SessionStorage
  deviceId: string
  now?: () => number
}

// Refreshing a little before the expiry avoids a request that leaves with a
// valid token and arrives after it expired.
export const REFRESH_MARGIN_MS = 60_000

function toStoredSession(issued: AuthenticationSessionResource): StoredSession {
  return {
    accessToken: issued.access_token,
    accessExpiresAt: issued.access_expires_at,
    refreshToken: issued.refresh_token,
  }
}

export function createAuthSession({
  storage,
  deviceId,
  now = Date.now,
}: AuthSessionOptions): AuthSession {
  // Several requests can find an expired token at the same time. They share
  // one refresh, because the back end revokes the session when a refresh
  // token is used twice.
  let pendingRefresh: Promise<string | undefined> | undefined

  async function refresh(refreshToken: string): Promise<string | undefined> {
    const { data } = await authenticationRefreshAuthenticationSession({
      body: { refresh_token: refreshToken },
      throwOnError: false,
    })
    if (!data) {
      storage.clear()
      return undefined
    }
    storage.set(toStoredSession(data))
    return data.access_token
  }

  return {
    deviceId,
    isAuthenticated: () => storage.get() !== null,
    async getAccessToken() {
      const stored = storage.get()
      if (!stored) {
        return undefined
      }
      const expiresAt = Date.parse(stored.accessExpiresAt)
      if (expiresAt - now() > REFRESH_MARGIN_MS) {
        return stored.accessToken
      }
      pendingRefresh ??= refresh(stored.refreshToken).finally(() => {
        pendingRefresh = undefined
      })
      return pendingRefresh
    },
    signIn(issued) {
      storage.set(toStoredSession(issued))
    },
    async signOut() {
      const stored = storage.get()
      storage.clear()
      if (stored) {
        // The session is already gone locally. A failure here leaves a
        // refresh token that nobody holds, which expires on its own.
        await authenticationLogout({
          body: { refresh_token: stored.refreshToken },
          throwOnError: false,
        })
      }
    },
    clear: () => storage.clear(),
  }
}
