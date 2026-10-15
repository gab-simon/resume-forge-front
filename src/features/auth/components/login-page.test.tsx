import { act, screen, waitFor } from "@testing-library/react"
import { toast } from "sonner"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { AuthenticationSessionResource } from "@/api/generated"
import { getLanguage, i18n } from "@/lib/i18n"
import { mockApi } from "@/test/api"
import { renderWithProviders } from "@/test/render"
import { LoginPage } from "./login-page"

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const CHALLENGE_ID = "challenge-id-with-at-least-32-characters"

const challenge = {
  challenge_id: CHALLENGE_ID,
  expires_at: "2026-10-14T12:10:00Z",
  expires_in_seconds: 600,
}

function issued(
  uiLanguage: "pt-BR" | "en-US" = "en-US",
): AuthenticationSessionResource {
  return {
    auth_session_id: 1,
    access_token: "access-token-with-at-least-32-characters",
    token_type: "bearer",
    access_expires_at: "2099-01-01T00:00:00Z",
    access_expires_in_seconds: 3600,
    refresh_token: "refresh-token-with-at-least-32-characters",
    refresh_expires_at: "2099-01-31T00:00:00Z",
    refresh_expires_in_seconds: 2_592_000,
    is_new_user: true,
    user: {
      user_id: 1,
      email: "ana@example.com",
      name: null,
      ui_language: uiLanguage,
      resume_language: "en",
      default_template: "classic",
      created_at: "2026-10-14T12:00:00Z",
    },
  }
}

function renderLoginPage() {
  const onSignedIn = vi.fn()
  const view = renderWithProviders(<LoginPage onSignedIn={onSignedIn} />)
  return { ...view, onSignedIn }
}

async function requestCode(user: ReturnType<typeof renderLoginPage>["user"]) {
  await user.type(screen.getByLabelText("Email"), "ana@example.com")
  await user.click(screen.getByRole("button", { name: "Send code" }))
  await screen.findByRole("heading", { name: "Check your email" })
}

beforeEach(() => {
  vi.mocked(toast.success).mockClear()
  vi.mocked(toast.error).mockClear()
})

describe("LoginPage", () => {
  it("sends the email in the language of the page and asks for the code", async () => {
    const api = mockApi({
      "POST /api/v1/auth/challenges": () => ({ status: 202, body: challenge }),
    })
    const { user } = renderLoginPage()

    await requestCode(user)

    expect(api.calls[0]?.body).toEqual({
      email: "ana@example.com",
      language: "en-US",
    })
    expect(
      screen.getByText(/We sent a 6-digit code to ana@example.com/),
    ).toBeInTheDocument()
  })

  it("validates the email without sending a request", async () => {
    const api = mockApi({})
    const { user } = renderLoginPage()

    await user.click(screen.getByRole("button", { name: "Send code" }))
    expect(await screen.findByText("Email is required")).toBeInTheDocument()

    await user.type(screen.getByLabelText("Email"), "ana")
    await user.click(screen.getByRole("button", { name: "Send code" }))
    expect(await screen.findByText("Enter a valid email")).toBeInTheDocument()
    expect(api.calls).toEqual([])
  })

  it("shows the API error when the code cannot be sent", async () => {
    mockApi({
      "POST /api/v1/auth/challenges": () => ({
        status: 429,
        body: { detail: "Too many authentication-code requests." },
      }),
    })
    const { user } = renderLoginPage()

    await user.type(screen.getByLabelText("Email"), "ana@example.com")
    await user.click(screen.getByRole("button", { name: "Send code" }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Too many authentication-code requests.",
      ),
    )
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
  })

  it("verifies the code, stores the session and applies the account language", async () => {
    const api = mockApi({
      "POST /api/v1/auth/challenges": () => ({ status: 202, body: challenge }),
      "POST /api/v1/auth/challenges/:id/verify": () => ({
        body: issued("pt-BR"),
      }),
    })
    const { user, onSignedIn, auth } = renderLoginPage()

    await requestCode(user)
    await user.type(screen.getByLabelText("Code"), "482 913")
    await user.click(screen.getByRole("button", { name: "Sign in" }))

    await waitFor(() => expect(onSignedIn).toHaveBeenCalled())
    const verify = api.calls.find((call) => call.path.endsWith("/verify"))
    expect(verify?.path).toBe(`/api/v1/auth/challenges/${CHALLENGE_ID}/verify`)
    expect(verify?.body).toEqual({
      code: "482913",
      device_id: "test-device-id",
      platform: "web",
    })
    expect(auth.isAuthenticated()).toBe(true)
    expect(getLanguage()).toBe("pt-BR")
  })

  it("keeps the user on the code step after a wrong code", async () => {
    mockApi({
      "POST /api/v1/auth/challenges": () => ({ status: 202, body: challenge }),
      "POST /api/v1/auth/challenges/:id/verify": () => ({
        status: 401,
        body: { detail: "Invalid or expired authentication code." },
      }),
    })
    const { user, onSignedIn, auth } = renderLoginPage()

    await requestCode(user)
    await user.type(screen.getByLabelText("Code"), "000000")
    await user.click(screen.getByRole("button", { name: "Sign in" }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Invalid or expired authentication code.",
      ),
    )
    expect(screen.getByLabelText("Code")).toHaveValue("")
    expect(onSignedIn).not.toHaveBeenCalled()
    expect(auth.isAuthenticated()).toBe(false)
  })

  it("validates the code without sending a request", async () => {
    const api = mockApi({
      "POST /api/v1/auth/challenges": () => ({ status: 202, body: challenge }),
    })
    const { user } = renderLoginPage()

    await requestCode(user)
    await user.type(screen.getByLabelText("Code"), "123")
    await user.click(screen.getByRole("button", { name: "Sign in" }))

    expect(await screen.findByText("The code has 6 digits")).toBeInTheDocument()
    expect(api.calls).toHaveLength(1)
  })

  it("sends a new code and verifies it with the new challenge", async () => {
    let next = 0
    const api = mockApi({
      "POST /api/v1/auth/challenges": () => ({
        status: 202,
        body: { ...challenge, challenge_id: `${CHALLENGE_ID}-${next++}` },
      }),
      "POST /api/v1/auth/challenges/:id/verify": () => ({ body: issued() }),
    })
    const { user, onSignedIn } = renderLoginPage()

    await requestCode(user)
    await user.click(screen.getByRole("button", { name: "Send a new code" }))
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("We sent a new code"),
    )
    await user.type(screen.getByLabelText("Code"), "482913")
    await user.click(screen.getByRole("button", { name: "Sign in" }))

    await waitFor(() => expect(onSignedIn).toHaveBeenCalled())
    expect(api.calls.at(-1)?.path).toBe(
      `/api/v1/auth/challenges/${CHALLENGE_ID}-1/verify`,
    )
  })

  it("goes back to the email step", async () => {
    mockApi({
      "POST /api/v1/auth/challenges": () => ({ status: 202, body: challenge }),
    })
    const { user } = renderLoginPage()

    await requestCode(user)
    await user.click(screen.getByRole("button", { name: "Use another email" }))

    expect(
      screen.getByRole("heading", { name: "Sign in to your account" }),
    ).toBeInTheDocument()
  })

  it("changes the language from the login page", async () => {
    const { user } = renderLoginPage()

    await user.click(screen.getByRole("button", { name: "Português (Brasil)" }))

    expect(
      await screen.findByRole("heading", { name: "Entre na sua conta" }),
    ).toBeInTheDocument()
    await act(() => i18n.changeLanguage("en-US"))
  })
})
