import { expect, signIn, test, usesRealApi } from "./fixtures"

test.skip(usesRealApi, "The login needs the code sent by email.")

test("sends a visitor to the login and back to the page they asked for", async ({
  page,
}) => {
  await page.goto("/settings")

  await expect(page).toHaveURL(/\/login\?redirect=/)
  await expect(
    page.getByRole("heading", { name: "Sign in to your account" }),
  ).toBeVisible()

  await signIn(page)

  await expect(page).toHaveURL(/\/settings$/)
  await expect(
    page.getByRole("heading", { name: "Settings", exact: true }),
  ).toBeVisible()
  await expect(page.getByLabel("Email")).toHaveValue("ana@example.com")
})

test("keeps the user on the code step after a wrong code", async ({ page }) => {
  await page.goto("/login")
  await page.getByLabel("Email").fill("ana@example.com")
  await page.getByRole("button", { name: "Send code" }).click()
  await page.getByLabel("Code").fill("000000")
  await page.getByRole("button", { name: "Sign in" }).click()

  await expect(
    page.getByText("Invalid or expired authentication code."),
  ).toBeVisible()
  await expect(page).toHaveURL(/\/login/)
})

test("keeps the session after a reload and ends it at sign-out", async ({
  page,
}) => {
  await page.goto("/")
  await signIn(page)
  await expect(
    page.getByRole("heading", { name: "Hello, ana@example.com" }),
  ).toBeVisible()

  await page.reload()
  await expect(
    page.getByRole("heading", { name: "Hello, ana@example.com" }),
  ).toBeVisible()

  await page.getByRole("button", { name: "ana@example.com" }).click()
  await page.getByRole("menuitem", { name: "Sign out" }).click()

  await expect(page).toHaveURL(/\/login/)
  await page.goto("/settings")
  await expect(page).toHaveURL(/\/login\?redirect=/)
})

test("saves the name shown in the sidebar", async ({ page }) => {
  await page.goto("/settings")
  await signIn(page)

  await page.getByLabel("Name").fill("Ana Souza")
  await page.getByRole("button", { name: "Save" }).click()

  await expect(page.getByText("Settings saved")).toBeVisible()
  await expect(page.getByRole("button", { name: "Ana Souza" })).toBeVisible()
  await page.goto("/")
  await expect(
    page.getByRole("heading", { name: "Hello, Ana Souza" }),
  ).toBeVisible()
})
