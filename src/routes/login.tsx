import { createFileRoute, redirect, useRouter } from "@tanstack/react-router"
import { APP_NAME } from "@/config/app"
import { loginSearchSchema } from "@/features/auth"
import { LoginPage } from "@/features/auth/components"
import { i18n } from "@/lib/i18n"

export const Route = createFileRoute("/login")({
  validateSearch: loginSearchSchema,
  beforeLoad: ({ context, search }) => {
    if (context.auth.isAuthenticated()) {
      throw redirect({ href: search.redirect ?? "/" })
    }
  },
  head: () => ({
    meta: [{ title: `${i18n.t("auth.pageTitle")} | ${APP_NAME}` }],
  }),
  component: LoginRoute,
})

function LoginRoute() {
  const { redirect: target } = Route.useSearch()
  const router = useRouter()

  // `redirect` is a path of this application, checked by loginSearchSchema.
  return <LoginPage onSignedIn={() => router.history.push(target ?? "/")} />
}
