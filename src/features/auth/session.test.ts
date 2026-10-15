import { describe, expect, it } from "vitest"
import type { AuthenticationSessionResource } from "@/api/generated"
import { mockApi } from "@/test/api"
import { createMemorySessionStorage } from "@/test/render"
import {
  createAuthSession,
  REFRESH_MARGIN_MS,
  type StoredSession,
} from "./session"

const NOW = Date.parse("2026-10-14T12:00:00Z")

const stored: StoredSession = {
  accessToken: "old-access",
  accessExpiresAt: new Date(NOW + 30 * 60_000).toISOString(),
  refreshToken: "old-refresh",
}

function issued(
  overrides: Partial<AuthenticationSessionResource> = {},
): AuthenticationSessionResource {
  return {
    auth_session_id: 1,
    access_token: "new-access",
    token_type: "bearer",
    access_expires_at: new Date(NOW + 60 * 60_000).toISOString(),
    access_expires_in_seconds: 3600,
    refresh_token: "new-refresh",
    refresh_expires_at: new Date(NOW + 30 * 86_400_000).toISOString(),
    refresh_expires_in_seconds: 2_592_000,
    is_new_user: false,
    user: {
      user_id: 1,
      email: "ana@example.com",
      name: "Ana",
      ui_language: "pt-BR",
      resume_language: "pt",
      default_template: "classic",
      created_at: "2026-10-01T12:00:00Z",
    },
    ...overrides,
  }
}

function sessionWith(initial: StoredSession | null) {
  const storage = createMemorySessionStorage(initial)
  const session = createAuthSession({
    storage,
    deviceId: "device-123",
    now: () => NOW,
  })
  return { storage, session }
}

describe("createAuthSession", () => {
  it("has no token before sign-in", async () => {
    const { session } = sessionWith(null)

    expect(session.isAuthenticated()).toBe(false)
    expect(await session.getAccessToken()).toBeUndefined()
  })

  it("stores the tokens issued at sign-in", async () => {
    const { session, storage } = sessionWith(null)

    session.signIn(issued())

    expect(session.isAuthenticated()).toBe(true)
    expect(storage.get()?.refreshToken).toBe("new-refresh")
    expect(await session.getAccessToken()).toBe("new-access")
  })

  it("returns the stored token while it is far from expiring", async () => {
    const api = mockApi({})
    const { session } = sessionWith(stored)

    expect(await session.getAccessToken()).toBe("old-access")
    expect(api.calls).toEqual([])
  })

  it("refreshes once for concurrent requests near the expiry", async () => {
    const api = mockApi({
      "POST /api/v1/auth/refresh": () => ({ body: issued() }),
    })
    const { session, storage } = sessionWith({
      ...stored,
      accessExpiresAt: new Date(NOW + REFRESH_MARGIN_MS - 1).toISOString(),
    })

    const tokens = await Promise.all([
      session.getAccessToken(),
      session.getAccessToken(),
    ])

    expect(tokens).toEqual(["new-access", "new-access"])
    expect(api.calls).toHaveLength(1)
    expect(api.calls[0]?.body).toEqual({ refresh_token: "old-refresh" })
    expect(storage.get()?.refreshToken).toBe("new-refresh")
  })

  it("ends the session when the refresh is refused", async () => {
    mockApi({
      "POST /api/v1/auth/refresh": () => ({
        status: 401,
        body: { detail: "Invalid or expired refresh token." },
      }),
    })
    const { session } = sessionWith({
      ...stored,
      accessExpiresAt: new Date(NOW).toISOString(),
    })

    expect(await session.getAccessToken()).toBeUndefined()
    expect(session.isAuthenticated()).toBe(false)
  })

  it("revokes the session on the back end at sign-out", async () => {
    const api = mockApi({
      "POST /api/v1/auth/logout": () => ({ status: 204 }),
    })
    const { session } = sessionWith(stored)

    await session.signOut()

    expect(session.isAuthenticated()).toBe(false)
    expect(api.calls[0]?.body).toEqual({ refresh_token: "old-refresh" })
  })

  it("forgets the session even when the logout request fails", async () => {
    mockApi({
      "POST /api/v1/auth/logout": () => ({ status: 500, body: {} }),
    })
    const { session } = sessionWith(stored)

    await session.signOut()

    expect(session.isAuthenticated()).toBe(false)
  })

  it("signs out without a request when there is no session", async () => {
    const api = mockApi({})
    const { session } = sessionWith(null)

    await session.signOut()

    expect(api.calls).toEqual([])
  })
})
