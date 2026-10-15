import { createFileRoute, Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { APP_NAME } from "@/config/app"
import { useMe } from "@/features/account"
import { i18n } from "@/lib/i18n"

export const Route = createFileRoute("/_app/")({
  head: () => ({ meta: [{ title: `${i18n.t("nav.home")} | ${APP_NAME}` }] }),
  component: HomeRoute,
})

function HomeRoute() {
  const { t } = useTranslation()
  const me = useMe()
  const name = me.data?.name ?? me.data?.email

  return (
    <div className="flex flex-col items-start gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {name ? t("home.greeting", { name }) : t("home.title")}
        </h1>
        <p className="text-muted-foreground">{t("home.description")}</p>
      </div>
      <Button asChild variant="outline">
        <Link to="/settings">{t("home.openSettings")}</Link>
      </Button>
    </div>
  )
}
