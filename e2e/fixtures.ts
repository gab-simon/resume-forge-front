import { test as base, type Page, type Route } from "@playwright/test"

// By default the E2E tests run against an in-memory copy of the items API, so
// they need no back end. Set E2E_REAL_API=1 to send the requests to the back
// end at VITE_API_URL. When you add a feature, add its endpoints to a mock
// like MockItemsApi below.
export const usesRealApi = process.env.E2E_REAL_API === "1"

interface Item {
  item_id: number
  name: string
  description: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "access-control-allow-headers": "*",
}

// In-memory copy of the /api/v1/items endpoints described in openapi.json.
export class MockItemsApi {
  private items: Item[] = []
  private nextId = 1

  /** Adds items before the page loads. */
  seed(count: number): void {
    for (let index = 1; index <= count; index++) {
      this.create({
        name: `Seeded item ${String(index).padStart(2, "0")}`,
        description: null,
      })
    }
  }

  async install(page: Page): Promise<void> {
    await page.route(/\/api\/v1\/items(\/|\?|$)/, (route) => this.handle(route))
  }

  private create(input: Pick<Item, "name" | "description">): Item {
    const now = new Date().toISOString()
    const item: Item = {
      item_id: this.nextId++,
      name: input.name,
      description: input.description ?? null,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    }
    this.items.push(item)
    return item
  }

  private async handle(route: Route): Promise<void> {
    const request = route.request()
    const url = new URL(request.url())
    const id = url.pathname.split("/api/v1/items")[1]?.replace(/^\//, "") ?? ""
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, json: body, headers: CORS_HEADERS })

    if (request.method() === "OPTIONS") {
      return route.fulfill({ status: 204, headers: CORS_HEADERS })
    }

    if (id === "") {
      if (request.method() === "GET") {
        const offset = Number(url.searchParams.get("offset") ?? 0)
        const limit = Number(url.searchParams.get("limit") ?? 20)
        return json({
          items: this.items.slice(offset, offset + limit),
          total: this.items.length,
          offset,
          limit,
        })
      }
      if (request.method() === "POST") {
        return json(this.create(request.postDataJSON()), 201)
      }
    }

    const index = this.items.findIndex((item) => item.item_id === Number(id))
    const existing = this.items[index]
    if (!existing) {
      return json({ detail: "Item not found." }, 404)
    }
    if (request.method() === "GET") {
      return json(existing)
    }
    if (request.method() === "PATCH") {
      const updated: Item = {
        ...existing,
        ...request.postDataJSON(),
        updated_at: new Date().toISOString(),
      }
      this.items[index] = updated
      return json(updated)
    }
    if (request.method() === "DELETE") {
      this.items.splice(index, 1)
      return route.fulfill({ status: 204, headers: CORS_HEADERS })
    }
    return json({ detail: "Method Not Allowed" }, 405)
  }
}

export const test = base.extend<{ itemsApi: MockItemsApi }>({
  itemsApi: [
    async ({ page }, use) => {
      const api = new MockItemsApi()
      if (!usesRealApi) {
        await api.install(page)
      }
      await use(api)
    },
    { auto: true },
  ],
})

export { expect } from "@playwright/test"
