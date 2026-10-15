import { vi } from "vitest"

interface MockRequest {
  url: URL
  /** Values of the `:name` segments in the route path. */
  params: Record<string, string>
  /** Parsed JSON body, or undefined when the request has none. */
  body: unknown
}

interface MockResponse {
  status?: number
  body?: unknown
}

type Handler = (request: MockRequest) => MockResponse

export interface ApiCall {
  method: string
  path: string
  query: Record<string, string>
  body: unknown
}

/**
 * Replaces the global fetch with handlers keyed by "METHOD /path". The
 * generated client runs for real, so tests cover URL building, serialization
 * and error parsing. Path segments that start with ":" are parameters.
 *
 *   const api = mockApi({
 *     "GET /api/v1/items": () => ({ body: { items: [], total: 0 } }),
 *     "DELETE /api/v1/items/:id": () => ({ status: 204 }),
 *   })
 *   expect(api.calls).toContainEqual(expect.objectContaining({ method: "DELETE" }))
 */
export function mockApi(handlers: Record<string, Handler>) {
  const calls: ApiCall[] = []

  const routes = Object.entries(handlers).map(([key, handler]) => {
    const [method = "", path = ""] = key.split(" ")
    const pattern = path.replace(/:([A-Za-z]+)/g, "(?<$1>[^/]+)")
    return { method, regex: new RegExp(`^${pattern}$`), handler }
  })

  vi.stubGlobal("fetch", async (request: Request): Promise<Response> => {
    const url = new URL(request.url)
    const text = await request.text()
    const body: unknown = text === "" ? undefined : JSON.parse(text)

    calls.push({
      method: request.method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      body,
    })

    for (const route of routes) {
      const match = route.regex.exec(url.pathname)
      if (route.method === request.method && match) {
        const result = route.handler({
          url,
          params: { ...match.groups },
          body,
        })
        const status = result.status ?? 200
        // A 204 response cannot carry a body.
        return result.body === undefined
          ? new Response(null, { status })
          : Response.json(result.body, { status })
      }
    }

    throw new Error(`mockApi: no handler for ${request.method} ${url.pathname}`)
  })

  return { calls }
}
