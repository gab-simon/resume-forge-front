import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { type RenderResult, render } from "@testing-library/react"
import userEvent, { type UserEvent } from "@testing-library/user-event"
import type { ReactElement } from "react"
import {
  type AuthSession,
  AuthSessionContext,
  createAuthSession,
  type SessionStorage,
  type StoredSession,
} from "@/features/auth"

/** Session storage kept in memory, for tests. */
export function createMemorySessionStorage(
  initial: StoredSession | null = null,
): SessionStorage {
  let stored = initial
  return {
    get: () => stored,
    set: (session) => {
      stored = session
    },
    clear: () => {
      stored = null
    },
  }
}

export function createTestAuthSession(
  initial: StoredSession | null = null,
): AuthSession {
  return createAuthSession({
    storage: createMemorySessionStorage(initial),
    deviceId: "test-device-id",
  })
}

interface RenderOptions {
  /** Session the components see. Defaults to a new session without tokens. */
  auth?: AuthSession
}

/**
 * Renders a component inside a fresh QueryClient, so no cached data leaks from
 * one test to the next. Retries are off so a failed request fails at once.
 */
export function renderWithProviders(
  ui: ReactElement,
  { auth = createTestAuthSession() }: RenderOptions = {},
): RenderResult & { user: UserEvent; auth: AuthSession } {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return {
    user: userEvent.setup(),
    auth,
    ...render(
      <QueryClientProvider client={queryClient}>
        <AuthSessionContext value={auth}>{ui}</AuthSessionContext>
      </QueryClientProvider>,
    ),
  }
}
