import { QueryClient } from "@tanstack/react-query"
import { isNetworkError } from "@/api/errors"

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data stays fresh for 30 seconds. Within that window, remounting a
        // component or revisiting a route reads the cache without a request.
        staleTime: 30_000,
        // Retry twice when the request got no HTTP response. A 4xx or 5xx
        // response fails at once, because repeating it returns the same error.
        retry: (failureCount, error) =>
          isNetworkError(error) && failureCount < 2,
        // Internal tools rarely need a refetch on every tab switch. Turn this
        // on per query when the data changes often.
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}
