import { afterEach, describe, expect, it, vi } from "vitest"
import { configureApiClient } from "@/api/client"
import {
  authenticationVerifyAuthenticationCode,
  healthHealthLiveness,
  meReadMe,
} from "@/api/generated"
import { mockApi } from "@/test/api"

const BASE_URL = "http://api.test"

afterEach(() => {
  // Back to the configuration of src/test/setup.ts.
  configureApiClient({ baseUrl: BASE_URL })
})

function headerOf(request: Request | undefined, name: string) {
  return request?.headers.get(name) ?? null
}

describe("configureApiClient", () => {
  it("sends the token only to operations that require authentication", async () => {
    const requests: Request[] = []
    vi.stubGlobal("fetch", async (request: Request) => {
      requests.push(request)
      return Response.json({}, { status: 200 })
    })
    configureApiClient({
      baseUrl: BASE_URL,
      getToken: async () => "access-token",
    })

    await meReadMe()
    await healthHealthLiveness({ throwOnError: false })

    expect(headerOf(requests[0], "Authorization")).toBe("Bearer access-token")
    expect(headerOf(requests[1], "Authorization")).toBeNull()
  })

  it("reports a 401 of an authenticated operation", async () => {
    mockApi({
      "GET /api/v1/me": () => ({
        status: 401,
        body: { detail: "Invalid or expired authentication session." },
      }),
    })
    const onUnauthorized = vi.fn()
    configureApiClient({
      baseUrl: BASE_URL,
      getToken: async () => "expired",
      onUnauthorized,
    })

    await expect(meReadMe()).rejects.toEqual({
      detail: "Invalid or expired authentication session.",
    })
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it("does not report the 401 of a wrong login code", async () => {
    mockApi({
      "POST /api/v1/auth/challenges/:id/verify": () => ({
        status: 401,
        body: { detail: "Invalid or expired authentication code." },
      }),
    })
    const onUnauthorized = vi.fn()
    configureApiClient({ baseUrl: BASE_URL, onUnauthorized })

    await expect(
      authenticationVerifyAuthenticationCode({
        path: { challenge_id: "challenge-id-with-at-least-32-characters" },
        body: { code: "000000", device_id: "device-123", platform: "web" },
      }),
    ).rejects.toBeDefined()
    expect(onUnauthorized).not.toHaveBeenCalled()
  })

  it("installs the 401 handler only once when configured again", async () => {
    mockApi({
      "GET /api/v1/me": () => ({ status: 401, body: { detail: "Expired." } }),
    })
    const first = vi.fn()
    const second = vi.fn()
    configureApiClient({ baseUrl: BASE_URL, onUnauthorized: first })
    configureApiClient({ baseUrl: BASE_URL, onUnauthorized: second })

    await expect(meReadMe()).rejects.toBeDefined()
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })
})
