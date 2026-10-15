import { test as base, expect, type Page, type Route } from "@playwright/test"

// By default the E2E tests run against an in-memory copy of the API, so they
// need no back end. Set E2E_REAL_API=1 to send the requests to the back end
// at VITE_API_URL; the login then needs a real code, so only the specs that
// do not sign in work in that mode. When you add a feature, add its
// endpoints to MockApi below.
export const usesRealApi = process.env.E2E_REAL_API === "1"

/** The only code the mocked API accepts. */
export const VALID_CODE = "123456"

interface User {
  user_id: number
  email: string
  name: string | null
  ui_language: "pt-BR" | "en-US"
  resume_language: "pt" | "en"
  default_template: string
  created_at: string
}

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "access-control-allow-headers": "*",
}

const TEMPLATES = [{ name: "classic" }]

// In-memory copy of the /api/v1 endpoints described in openapi.json.
export class MockApi {
  private users = new Map<string, User>()
  private challenges = new Map<string, { email: string; language: string }>()
  private tokens = new Map<string, string>()
  private nextId = 1

  async install(page: Page): Promise<void> {
    await page.route(/\/api\/v1\//, (route) => this.handle(route))
  }

  private issue(user: User, isNewUser: boolean) {
    const token = `access-${this.nextId++}-${"x".repeat(32)}`
    const refresh = `refresh-${this.nextId++}-${"x".repeat(32)}`
    this.tokens.set(token, user.email)
    const now = Date.now()
    return {
      auth_session_id: this.nextId++,
      access_token: token,
      token_type: "bearer",
      access_expires_at: new Date(now + 3_600_000).toISOString(),
      access_expires_in_seconds: 3600,
      refresh_token: refresh,
      refresh_expires_at: new Date(now + 2_592_000_000).toISOString(),
      refresh_expires_in_seconds: 2_592_000,
      is_new_user: isNewUser,
      user,
    }
  }

  private currentUser(route: Route): User | undefined {
    const header = route.request().headers().authorization ?? ""
    const email = this.tokens.get(header.replace(/^Bearer /, ""))
    return email ? this.users.get(email) : undefined
  }

  private async handle(route: Route): Promise<void> {
    const request = route.request()
    const method = request.method()
    const path = new URL(request.url()).pathname.replace(/^\/api\/v1/, "")
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, json: body, headers: CORS_HEADERS })

    if (method === "OPTIONS") {
      return route.fulfill({ status: 204, headers: CORS_HEADERS })
    }

    if (method === "POST" && path === "/auth/challenges") {
      const { email, language } = request.postDataJSON()
      const challengeId = `challenge-${this.nextId++}-${"x".repeat(32)}`
      this.challenges.set(challengeId, {
        email: String(email).toLowerCase(),
        language: language ?? "pt-BR",
      })
      return json(
        {
          challenge_id: challengeId,
          expires_at: new Date(Date.now() + 600_000).toISOString(),
          expires_in_seconds: 600,
        },
        202,
      )
    }

    const verify = /^\/auth\/challenges\/([^/]+)\/verify$/.exec(path)
    if (method === "POST" && verify) {
      const challenge = this.challenges.get(verify[1] ?? "")
      if (!challenge || request.postDataJSON().code !== VALID_CODE) {
        return json({ detail: "Invalid or expired authentication code." }, 401)
      }
      this.challenges.delete(verify[1] ?? "")
      const existing = this.users.get(challenge.email)
      const user: User = existing ?? {
        user_id: this.nextId++,
        email: challenge.email,
        name: null,
        ui_language: challenge.language === "en-US" ? "en-US" : "pt-BR",
        resume_language: challenge.language === "en-US" ? "en" : "pt",
        default_template: "classic",
        created_at: new Date().toISOString(),
      }
      this.users.set(user.email, user)
      return json(this.issue(user, existing === undefined))
    }

    if (method === "POST" && path === "/auth/logout") {
      return route.fulfill({ status: 204, headers: CORS_HEADERS })
    }

    const user = this.currentUser(route)
    if (!user) {
      return json({ detail: "Invalid or expired authentication session." }, 401)
    }

    if (path === "/me" && method === "GET") {
      return json(user)
    }
    if (path === "/me" && method === "PATCH") {
      const updated: User = { ...user, ...request.postDataJSON() }
      this.users.set(user.email, updated)
      return json(updated)
    }
    if (path === "/resume/templates" && method === "GET") {
      return json(TEMPLATES)
    }
    return json({ detail: "Not Found" }, 404)
  }
}

/** Signs in through the login page, which must be open. */
export async function signIn(page: Page, email = "ana@example.com") {
  await page.getByLabel(/^(Email|E-mail)$/).fill(email)
  await page
    .getByRole("button", { name: /^(Send code|Enviar código)$/ })
    .click()
  await page.getByLabel(/^(Code|Código)$/).fill(VALID_CODE)
  await page.getByRole("button", { name: /^(Sign in|Entrar)$/ }).click()
}

export const test = base.extend<{ api: MockApi }>({
  api: [
    async ({ page }, use) => {
      const api = new MockApi()
      if (!usesRealApi) {
        await api.install(page)
      }
      await use(api)
    },
    { auto: true },
  ],
})

export { expect }
