import { act, screen, waitFor } from "@testing-library/react"
import { toast } from "sonner"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { UserResource } from "@/api/generated"
import { getLanguage, i18n } from "@/lib/i18n"
import { mockApi } from "@/test/api"
import { renderWithProviders } from "@/test/render"
import { SettingsPage } from "./settings-page"

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const ana: UserResource = {
  user_id: 1,
  email: "ana@example.com",
  name: "Ana",
  ui_language: "en-US",
  resume_language: "pt",
  default_template: "classic",
  created_at: "2026-10-14T12:00:00Z",
}

const templates = [{ name: "classic" }, { name: "modern" }]

beforeEach(() => {
  vi.mocked(toast.success).mockClear()
  vi.mocked(toast.error).mockClear()
})

describe("SettingsPage", () => {
  it("shows a skeleton and then the values of the account", async () => {
    mockApi({
      "GET /api/v1/me": () => ({ body: ana }),
      "GET /api/v1/resume/templates": () => ({ body: templates }),
    })
    renderWithProviders(<SettingsPage />)

    expect(screen.getByTestId("settings-skeleton")).toBeInTheDocument()
    expect(await screen.findByLabelText("Name")).toHaveValue("Ana")
    expect(screen.getByLabelText("Email")).toHaveValue("ana@example.com")
    expect(
      screen.getByRole("combobox", { name: "Resume language" }),
    ).toHaveTextContent("Portuguese")
    expect(
      screen.getByRole("combobox", { name: "Default template" }),
    ).toHaveTextContent("classic")
  })

  it("shows the API error and loads the account again on retry", async () => {
    let failing = true
    mockApi({
      "GET /api/v1/me": () =>
        failing
          ? { status: 500, body: { detail: "Database unavailable." } }
          : { body: ana },
      "GET /api/v1/resume/templates": () => ({ body: templates }),
    })
    const { user } = renderWithProviders(<SettingsPage />)

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Database unavailable.",
    )

    failing = false
    await user.click(screen.getByRole("button", { name: "Try again" }))

    expect(await screen.findByLabelText("Name")).toHaveValue("Ana")
  })

  it("saves the name and preferences", async () => {
    const api = mockApi({
      "GET /api/v1/me": () => ({ body: ana }),
      "GET /api/v1/resume/templates": () => ({ body: templates }),
      "PATCH /api/v1/me": ({ body }) => ({
        body: { ...ana, ...(body as Partial<UserResource>) },
      }),
    })
    const { user } = renderWithProviders(<SettingsPage />)

    const name = await screen.findByLabelText("Name")
    await user.clear(name)
    await user.click(screen.getByRole("combobox", { name: "Resume language" }))
    await user.click(await screen.findByRole("option", { name: "English" }))
    await user.click(screen.getByRole("combobox", { name: "Default template" }))
    await user.click(await screen.findByRole("option", { name: "modern" }))
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Settings saved"),
    )
    expect(api.calls.find((call) => call.method === "PATCH")?.body).toEqual({
      name: null,
      ui_language: "en-US",
      resume_language: "en",
      default_template: "modern",
    })
  })

  it("switches the interface to the saved language", async () => {
    mockApi({
      "GET /api/v1/me": () => ({ body: ana }),
      "GET /api/v1/resume/templates": () => ({ body: templates }),
      "PATCH /api/v1/me": ({ body }) => ({
        body: { ...ana, ...(body as Partial<UserResource>) },
      }),
    })
    const { user } = renderWithProviders(<SettingsPage />)

    await screen.findByLabelText("Name")
    await user.click(
      screen.getByRole("combobox", { name: "Interface language" }),
    )
    await user.click(
      await screen.findByRole("option", { name: "Português (Brasil)" }),
    )
    await user.click(screen.getByRole("button", { name: "Save" }))

    expect(
      await screen.findByRole("heading", { name: "Configurações" }),
    ).toBeInTheDocument()
    expect(getLanguage()).toBe("pt-BR")
  })

  it("shows the API error when saving fails", async () => {
    mockApi({
      "GET /api/v1/me": () => ({ body: ana }),
      "GET /api/v1/resume/templates": () => ({ body: templates }),
      "PATCH /api/v1/me": () => ({
        status: 422,
        body: { detail: "Template not found: modern." },
      }),
    })
    const { user } = renderWithProviders(<SettingsPage />)

    await screen.findByLabelText("Name")
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Template not found: modern."),
    )
  })

  it("translates a validation message when the language changes", async () => {
    mockApi({
      "GET /api/v1/me": () => ({ body: ana }),
      "GET /api/v1/resume/templates": () => ({ body: templates }),
    })
    const { user } = renderWithProviders(<SettingsPage />)

    const name = await screen.findByLabelText("Name")
    await user.clear(name)
    await user.type(name, "a".repeat(256))
    await user.click(screen.getByRole("button", { name: "Save" }))
    expect(
      await screen.findByText("Name must have at most 255 characters"),
    ).toBeInTheDocument()

    await act(() => i18n.changeLanguage("pt-BR"))

    expect(
      await screen.findByText("O nome deve ter no máximo 255 caracteres"),
    ).toBeInTheDocument()
  })
})
