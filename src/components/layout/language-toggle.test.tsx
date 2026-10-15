import { screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { SidebarProvider } from "@/components/ui/sidebar"
import { getLanguage } from "@/lib/i18n"
import { renderWithProviders } from "@/test/render"
import { LanguageToggle } from "./language-toggle"

function renderLanguageToggle() {
  return renderWithProviders(
    <SidebarProvider>
      <LanguageToggle />
    </SidebarProvider>,
  )
}

describe("LanguageToggle", () => {
  it("lists each language by its own name", async () => {
    const { user } = renderLanguageToggle()

    await user.click(screen.getByRole("button", { name: "Language" }))

    expect(
      await screen.findByRole("menuitem", { name: "English (US)" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("menuitem", { name: "Português (Brasil)" }),
    ).toBeInTheDocument()
  })

  it("changes the language of the interface", async () => {
    const { user } = renderLanguageToggle()

    await user.click(screen.getByRole("button", { name: "Language" }))
    await user.click(
      await screen.findByRole("menuitem", { name: "Português (Brasil)" }),
    )

    expect(
      await screen.findByRole("button", { name: "Idioma" }),
    ).toBeInTheDocument()
    expect(getLanguage()).toBe("pt-BR")
  })
})
