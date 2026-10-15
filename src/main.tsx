import { QueryClientProvider } from "@tanstack/react-query"
import { createRouter, RouterProvider } from "@tanstack/react-router"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { configureApiClient } from "@/api/client"
import { ThemeProvider } from "@/components/layout/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { env } from "@/config/env"
import {
  AuthSessionContext,
  createAuthSession,
  type StoredSession,
} from "@/features/auth"
import { createJsonStorage, getOrCreateId } from "@/lib/browser-storage"
import { installChunkReloadHandler } from "@/lib/chunk-reload"
import {
  configureI18n,
  detectLanguage,
  getLanguage,
  LANGUAGE_STORAGE_KEY,
} from "@/lib/i18n"
import { createQueryClient } from "@/lib/query-client"
import "./index.css"
import { routeTree } from "./routeTree.gen"

const SESSION_STORAGE_KEY = "auth-session"
const DEVICE_ID_STORAGE_KEY = "device-id"

function isStoredSession(value: unknown): value is StoredSession {
  return (
    typeof value === "object" &&
    value !== null &&
    "accessToken" in value &&
    typeof value.accessToken === "string" &&
    "accessExpiresAt" in value &&
    typeof value.accessExpiresAt === "string" &&
    "refreshToken" in value &&
    typeof value.refreshToken === "string"
  )
}

// The tokens stay in localStorage so a session survives reloads and new tabs.
// Any script running on the page can read them, which is why the access token
// is short-lived and a reused refresh token revokes the whole session.
const authSession = createAuthSession({
  storage: createJsonStorage(
    window.localStorage,
    SESSION_STORAGE_KEY,
    isStoredSession,
  ),
  deviceId: getOrCreateId(window.localStorage, DEVICE_ID_STORAGE_KEY, () =>
    crypto.randomUUID(),
  ),
})

// Must run before the router is created. See src/api/client.ts.
configureApiClient({
  baseUrl: env.apiUrl,
  getToken: authSession.getAccessToken,
  onUnauthorized: () => {
    authSession.clear()
    queryClient.clear()
    void router.navigate({
      to: "/login",
      search: { redirect: router.state.location.href },
    })
  },
})

// Accessing window.sessionStorage throws when the browser blocks site data.
// Without it the handler is not installed and a stale chunk shows the router
// error screen.
try {
  installChunkReloadHandler({
    target: window,
    storage: window.sessionStorage,
    reload: () => window.location.reload(),
  })
} catch {
  // Nothing to do. See the comment above.
}

const queryClient = createQueryClient()

const router = createRouter({
  routeTree,
  context: { queryClient, auth: authSession },
  // Hovering or focusing a link loads the route chunk and runs its loader.
  defaultPreload: "intent",
  // TanStack Query owns the cache, so the router must not cache loader results.
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
})

// Accessing window.localStorage throws when the browser blocks site data.
// The language then comes from the browser on every page load.
function readStoredLanguage(): string | null {
  try {
    return window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  } catch {
    return null
  }
}

configureI18n({
  language: detectLanguage(readStoredLanguage(), navigator.languages),
  onLanguageChange: (language) => {
    document.documentElement.lang = language
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    } catch {
      // Nothing to do. See the comment above.
    }
    // The routes build the tab title in `head`, which runs again only when
    // the router reloads the matches.
    void router.invalidate()
  },
})
document.documentElement.lang = getLanguage()

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById("root")
if (!rootElement) {
  throw new Error('index.html is missing the <div id="root"> element')
}

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="ui-theme">
      <QueryClientProvider client={queryClient}>
        <AuthSessionContext value={authSession}>
          <RouterProvider router={router} />
        </AuthSessionContext>
        <Toaster richColors closeButton />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)
