import { expect, signIn, test, usesRealApi } from "./fixtures"

test("uses English in a browser set to English", async ({ page }) => {
  await page.goto("/login")

  await expect(
    page.getByRole("heading", { name: "Sign in to your account" }),
  ).toBeVisible()
  await expect(page.locator("html")).toHaveAttribute("lang", "en-US")
})

test.describe("in a browser set to Portuguese", () => {
  test.use({ locale: "pt-BR" })

  test("starts in Portuguese and keeps the language chosen on the login page", async ({
    page,
  }) => {
    await page.goto("/login")

    await expect(
      page.getByRole("heading", { name: "Entre na sua conta" }),
    ).toBeVisible()
    await expect(page).toHaveTitle(/^Entrar \|/)
    await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR")

    await page.getByRole("button", { name: "English (US)" }).click()

    await expect(
      page.getByRole("heading", { name: "Sign in to your account" }),
    ).toBeVisible()
    await expect(page).toHaveTitle(/^Sign in \|/)
    await expect(page.locator("html")).toHaveAttribute("lang", "en-US")

    // The choice is stored, so it wins over the browser language on reload.
    await page.reload()
    await expect(
      page.getByRole("heading", { name: "Sign in to your account" }),
    ).toBeVisible()
  })

  test("translates the validation message of a form", async ({ page }) => {
    await page.goto("/login")
    await page.getByRole("button", { name: "Enviar código" }).click()

    await expect(page.getByText("O e-mail é obrigatório")).toBeVisible()
  })

  test("a new account keeps the language of the login page", async ({
    page,
  }) => {
    test.skip(usesRealApi, "The login needs the code sent by email.")
    await page.goto("/login")
    await signIn(page)

    await expect(
      page.getByRole("heading", { name: "Olá, ana@example.com" }),
    ).toBeVisible()
    await page.getByRole("link", { name: "Configurações" }).first().click()
    await expect(
      page.getByRole("combobox", { name: "Idioma do currículo" }),
    ).toHaveText("Português")
  })
})
