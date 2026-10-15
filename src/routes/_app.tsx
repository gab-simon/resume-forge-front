import { createFileRoute, Outlet } from "@tanstack/react-router"
import { AppShell } from "@/components/layout/app-shell"

// Pathless layout route. Every file in src/routes/_app/ renders inside the
// application shell (sidebar and header).
//
// AUTH: to protect these routes, add a `beforeLoad` here that throws
// `redirect({ to: "/login" })` when there is no session. See AGENTS.md.
export const Route = createFileRoute("/_app")({
  component: AppLayout,
})

function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
