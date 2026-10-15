import { expect, test } from "./fixtures"

test("uses English in a browser set to English", async ({ page }) => {
  await page.goto("/items")

  await expect(
    page.getByRole("heading", { name: "Items", exact: true }),
  ).toBeVisible()
  await expect(page.locator("html")).toHaveAttribute("lang", "en-US")
})

test.describe("in a browser set to Portuguese", () => {
  test.use({ locale: "pt-BR" })

  test("starts in Portuguese and keeps the language chosen in the sidebar", async ({
    page,
  }) => {
    await page.goto("/items")

    await expect(
      page.getByRole("heading", { name: "Itens", exact: true }),
    ).toBeVisible()
    await expect(page.getByRole("link", { name: "Início" })).toBeVisible()
    await expect(page).toHaveTitle(/^Itens \|/)
    await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR")

    await page.getByRole("button", { name: "Idioma" }).click()
    await page.getByRole("menuitem", { name: "English (US)" }).click()

    await expect(
      page.getByRole("heading", { name: "Items", exact: true }),
    ).toBeVisible()
    await expect(page).toHaveTitle(/^Items \|/)
    await expect(page.locator("html")).toHaveAttribute("lang", "en-US")

    // The choice is stored, so it wins over the browser language on reload.
    await page.reload()
    await expect(
      page.getByRole("heading", { name: "Items", exact: true }),
    ).toBeVisible()
    await expect(page.getByRole("button", { name: "Language" })).toBeVisible()
  })

  test("translates the validation message of a form", async ({ page }) => {
    await page.goto("/items")
    await page.getByRole("button", { name: "Adicionar item" }).click()
    await page.getByRole("button", { name: "Salvar" }).click()

    await expect(page.getByText("O nome é obrigatório")).toBeVisible()
  })
})
