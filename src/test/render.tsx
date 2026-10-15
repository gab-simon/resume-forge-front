import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { type RenderResult, render } from "@testing-library/react"
import userEvent, { type UserEvent } from "@testing-library/user-event"
import type { ReactElement } from "react"

/**
 * Renders a component inside a fresh QueryClient, so no cached data leaks from
 * one test to the next. Retries are off so a failed request fails at once.
 */
export function renderWithProviders(
  ui: ReactElement,
): RenderResult & { user: UserEvent } {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return {
    user: userEvent.setup(),
    ...render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    ),
  }
}
