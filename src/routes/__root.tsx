import type { QueryClient } from "@tanstack/react-query"
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
} from "@tanstack/react-router"
import { lazy, Suspense } from "react"
import { ErrorScreen } from "@/components/layout/error-screen"
import { NotFound } from "@/components/layout/not-found"
import { APP_NAME } from "@/config/app"
import type { AuthSession } from "@/features/auth"

export interface RouterContext {
  queryClient: QueryClient
  auth: AuthSession
}

// The devtools load only in development and are absent from the production bundle.
const Devtools = import.meta.env.DEV
  ? lazy(() => import("@/components/layout/devtools"))
  : () => null

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({ meta: [{ title: APP_NAME }] }),
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: ErrorScreen,
})

function RootComponent() {
  return (
    <>
      <HeadContent />
      <Outlet />
      <Suspense>
        <Devtools />
      </Suspense>
    </>
  )
}
