import { createFileRoute, Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { APP_NAME } from "@/config/app"
import { i18n } from "@/lib/i18n"

export const Route = createFileRoute("/_app/")({
  head: () => ({ meta: [{ title: `${i18n.t("nav.home")} | ${APP_NAME}` }] }),
  component: HomeRoute,
})

function HomeRoute() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-start gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("home.title")}</h1>
        <p className="text-muted-foreground">{t("home.description")}</p>
      </div>
      <Button asChild>
        <Link to="/items">{t("home.openItems")}</Link>
      </Button>
    </div>
  )
}
