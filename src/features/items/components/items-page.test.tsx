import { act, screen, waitFor, within } from "@testing-library/react"
import { toast } from "sonner"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ItemResource } from "@/api/generated"
import { i18n } from "@/lib/i18n"
import { mockApi } from "@/test/api"
import { renderWithProviders } from "@/test/render"
import { ItemsPage } from "./items-page"

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const timestamps = {
  created_at: "2026-01-15T12:00:00Z",
  updated_at: "2026-01-15T12:00:00Z",
  deleted_at: null,
}
const notebook: ItemResource = {
  item_id: 1,
  name: "Notebook",
  description: "A5, ruled",
  ...timestamps,
}
const pencil: ItemResource = {
  item_id: 2,
  name: "Pencil",
  description: null,
  ...timestamps,
}

function renderItemsPage(pagination = { page: 1, pageSize: 10 }) {
  const onPaginationChange = vi.fn()
  const view = renderWithProviders(
    <ItemsPage
      pagination={pagination}
      onPaginationChange={onPaginationChange}
    />,
  )
  return { ...view, onPaginationChange }
}

beforeEach(() => {
  vi.mocked(toast.success).mockClear()
  vi.mocked(toast.error).mockClear()
})

describe("ItemsPage", () => {
  it("shows a skeleton while loading and then the rows", async () => {
    const api = mockApi({
      "GET /api/v1/items": () => ({
        body: { items: [notebook, pencil], total: 2 },
      }),
    })
    renderItemsPage()

    expect(screen.getByTestId("data-table-skeleton")).toBeInTheDocument()
    expect(await screen.findByText("Notebook")).toBeInTheDocument()
    expect(screen.getByText("A5, ruled")).toBeInTheDocument()
    expect(screen.getByText("Pencil")).toBeInTheDocument()
    expect(screen.getByText("No description")).toBeInTheDocument()
    expect(api.calls[0]?.query).toEqual({ offset: "0", limit: "10" })
  })

  it("converts the page number to offset and limit", async () => {
    const api = mockApi({
      "GET /api/v1/items": () => ({ body: { items: [notebook], total: 11 } }),
    })
    renderItemsPage({ page: 2, pageSize: 5 })

    await screen.findByText("Notebook")
    expect(api.calls[0]?.query).toEqual({ offset: "5", limit: "5" })
  })

  it("shows the empty state when there are no items", async () => {
    mockApi({
      "GET /api/v1/items": () => ({ body: { items: [], total: 0 } }),
    })
    renderItemsPage()

    expect(
      await screen.findByText("You don't have any items yet"),
    ).toBeInTheDocument()
  })

  it("shows the API error and loads the list again on retry", async () => {
    let failing = true
    mockApi({
      "GET /api/v1/items": () =>
        failing
          ? { status: 500, body: { detail: "Database unavailable" } }
          : { body: { items: [notebook], total: 1 } },
    })
    const { user } = renderItemsPage()

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Database unavailable",
    )

    failing = false
    await user.click(screen.getByRole("button", { name: "Try again" }))

    expect(await screen.findByText("Notebook")).toBeInTheDocument()
  })

  it("asks for the next page", async () => {
    mockApi({
      "GET /api/v1/items": () => ({ body: { items: [notebook], total: 25 } }),
    })
    const { user, onPaginationChange } = renderItemsPage()

    await screen.findByText("Notebook")
    await user.click(screen.getByRole("button", { name: "Go to next page" }))

    expect(onPaginationChange).toHaveBeenCalledWith({ page: 2, pageSize: 10 })
  })

  it("creates an item and refreshes the list", async () => {
    const items: ItemResource[] = []
    const api = mockApi({
      "GET /api/v1/items": () => ({
        body: { items: items, total: items.length },
      }),
      "POST /api/v1/items": () => {
        items.push(notebook)
        return { body: notebook }
      },
    })
    const { user } = renderItemsPage()
    await screen.findByText("You don't have any items yet")

    await user.click(screen.getByRole("button", { name: "Add item" }))
    const dialog = await screen.findByRole("dialog")
    await user.type(within(dialog).getByLabelText(/Name/), "Notebook")
    await user.type(within(dialog).getByLabelText("Description"), "A5, ruled")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    )
    expect(api.calls).toContainEqual(
      expect.objectContaining({
        method: "POST",
        body: { name: "Notebook", description: "A5, ruled" },
      }),
    )
    expect(toast.success).toHaveBeenCalledWith("Item created successfully")
    // The mutation invalidated the list, so the table shows the new item.
    expect(screen.getByText("Notebook")).toBeInTheDocument()
  })

  it("validates the form and sends no request when the name is empty", async () => {
    const api = mockApi({
      "GET /api/v1/items": () => ({ body: { items: [], total: 0 } }),
    })
    const { user } = renderItemsPage()
    await screen.findByText("You don't have any items yet")

    await user.click(screen.getByRole("button", { name: "Add item" }))
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    expect(await within(dialog).findByText("Name is required")).toBeVisible()
    expect(api.calls.filter((call) => call.method === "POST")).toHaveLength(0)
  })

  it("follows a change of language, including a validation error on screen", async () => {
    mockApi({
      "GET /api/v1/items": () => ({ body: { items: [notebook], total: 1 } }),
    })
    const { user } = renderItemsPage()
    await screen.findByText("Notebook")

    await user.click(screen.getByRole("button", { name: "Add item" }))
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))
    await within(dialog).findByText("Name is required")

    await act(() => i18n.changeLanguage("pt-BR"))

    expect(within(dialog).getByText("O nome é obrigatório")).toBeVisible()
    expect(
      within(dialog).getByRole("heading", { name: "Adicionar item" }),
    ).toBeVisible()
    expect(within(dialog).getByRole("button", { name: "Salvar" })).toBeVisible()
    // The rest of the page is hidden from the accessibility tree while the
    // dialog is open, so these are found by text.
    expect(screen.getByText("Crie e gerencie seus itens")).toBeInTheDocument()
    // The total is in its own element, so no single text node has the sentence.
    expect(document.body).toHaveTextContent("Mostrando 1 a 1 de 1")
    expect(document.body).toHaveTextContent("Página 1 de 1")
    expect(screen.getByText("Ações de Notebook")).toBeInTheDocument()
  })

  it("shows an error toast and keeps the dialog open when the API rejects", async () => {
    mockApi({
      "GET /api/v1/items": () => ({ body: { items: [], total: 0 } }),
      "POST /api/v1/items": () => ({
        status: 409,
        body: { detail: "An item with this name already exists" },
      }),
    })
    const { user } = renderItemsPage()
    await screen.findByText("You don't have any items yet")

    await user.click(screen.getByRole("button", { name: "Add item" }))
    const dialog = await screen.findByRole("dialog")
    await user.type(within(dialog).getByLabelText(/Name/), "Notebook")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "An item with this name already exists",
      ),
    )
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("uses the translated fallback when an API error has no message", async () => {
    mockApi({
      "GET /api/v1/items": () => ({ status: 500, body: {} }),
    })
    renderItemsPage()

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again.",
    )
  })

  it("edits an item with the form filled in", async () => {
    const api = mockApi({
      "GET /api/v1/items": () => ({ body: { items: [notebook], total: 1 } }),
      "PATCH /api/v1/items/:id": () => ({
        body: { ...notebook, name: "Sketchbook" },
      }),
    })
    const { user } = renderItemsPage()
    await screen.findByText("Notebook")

    await user.click(
      screen.getByRole("button", { name: "Actions for Notebook" }),
    )
    await user.click(await screen.findByRole("menuitem", { name: "Edit" }))
    const dialog = await screen.findByRole("dialog")
    const name = within(dialog).getByLabelText(/Name/)
    expect(name).toHaveValue("Notebook")
    expect(within(dialog).getByLabelText("Description")).toHaveValue(
      "A5, ruled",
    )

    await user.clear(name)
    await user.type(name, "Sketchbook")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Item updated successfully"),
    )
    expect(api.calls).toContainEqual(
      expect.objectContaining({
        method: "PATCH",
        path: `/api/v1/items/${notebook.item_id}`,
        body: { name: "Sketchbook", description: "A5, ruled" },
      }),
    )
  })

  it("deletes an item only after confirmation", async () => {
    const items = [notebook]
    const api = mockApi({
      "GET /api/v1/items": () => ({
        body: { items: items, total: items.length },
      }),
      "DELETE /api/v1/items/:id": () => {
        items.length = 0
        return { status: 204 }
      },
    })
    const { user } = renderItemsPage()
    await screen.findByText("Notebook")

    await user.click(
      screen.getByRole("button", { name: "Actions for Notebook" }),
    )
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }))
    const dialog = await screen.findByRole("dialog")
    expect(api.calls.filter((call) => call.method === "DELETE")).toHaveLength(0)

    await user.click(within(dialog).getByRole("button", { name: "Delete" }))

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Item deleted successfully"),
    )
    expect(api.calls).toContainEqual(
      expect.objectContaining({
        method: "DELETE",
        path: `/api/v1/items/${notebook.item_id}`,
      }),
    )
    expect(
      await screen.findByText("You don't have any items yet"),
    ).toBeInTheDocument()
  })
})
