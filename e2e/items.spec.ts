import { expect, test, usesRealApi } from "./fixtures"

test("creates, edits and deletes an item", async ({ page }) => {
  // Unique names let this test also run against a real back end with data.
  const name = `E2E item ${Date.now()}`
  const updatedName = `${name} edited`

  await page.goto("/items")
  await expect(
    page.getByRole("heading", { name: "Items", exact: true }),
  ).toBeVisible()
  if (!usesRealApi) {
    await expect(page.getByText("You don't have any items yet")).toBeVisible()
  }

  // Create
  await page.getByRole("button", { name: "Add item" }).click()
  await page.getByLabel("Name").fill(name)
  await page.getByLabel("Description").fill("Created by Playwright")
  await page.getByRole("button", { name: "Save" }).click()

  await expect(page.getByText("Item created successfully")).toBeVisible()
  await expect(page.getByRole("dialog")).toBeHidden()
  const row = page.getByRole("row").filter({ hasText: name })
  await expect(row).toBeVisible()
  await expect(row).toContainText("Created by Playwright")

  // Edit
  await row.getByRole("button", { name: `Actions for ${name}` }).click()
  await page.getByRole("menuitem", { name: "Edit" }).click()
  await expect(page.getByLabel("Name")).toHaveValue(name)
  await page.getByLabel("Name").fill(updatedName)
  await page.getByRole("button", { name: "Save" }).click()

  await expect(page.getByText("Item updated successfully")).toBeVisible()
  const updatedRow = page.getByRole("row").filter({ hasText: updatedName })
  await expect(updatedRow).toBeVisible()

  // Delete
  await updatedRow
    .getByRole("button", { name: `Actions for ${updatedName}` })
    .click()
  await page.getByRole("menuitem", { name: "Delete" }).click()
  await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click()

  await expect(page.getByText("Item deleted successfully")).toBeVisible()
  await expect(updatedRow).toBeHidden()
})

test("validates the form before sending", async ({ page }) => {
  await page.goto("/items")
  await page.getByRole("button", { name: "Add item" }).click()
  await page.getByRole("button", { name: "Save" }).click()

  await expect(page.getByText("Name is required")).toBeVisible()
  await expect(page.getByRole("dialog")).toBeVisible()
})

test("keeps the page number in the URL", async ({ page, itemsApi }) => {
  test.skip(usesRealApi, "Needs the 12 seeded items of the mock API")
  itemsApi.seed(12)

  await page.goto("/items")
  await expect(page.getByText("Seeded item 01", { exact: true })).toBeVisible()
  await expect(page.getByText("Showing 1 to 10 of 12")).toBeVisible()

  await page.getByRole("button", { name: "Go to next page" }).click()

  await expect(page).toHaveURL(/page=2/)
  await expect(page.getByText("Seeded item 11", { exact: true })).toBeVisible()
  await expect(page.getByText("Seeded item 01", { exact: true })).toBeHidden()

  // The URL is the source of truth, so a reload stays on page 2.
  await page.reload()
  await expect(page.getByText("Seeded item 11", { exact: true })).toBeVisible()
})
