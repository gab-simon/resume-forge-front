import { Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"

export function NotFound() {
  const { t } = useTranslation()

  return (
    <div
      className="flex min-h-svh flex-col items-center justify-center gap-4 p-4 text-center"
      data-testid="not-found"
    >
      <span className="text-6xl font-bold md:text-8xl">404</span>
      <p className="text-lg text-muted-foreground">
        {t("errors.notFound.description")}
      </p>
      <Button asChild>
        <Link to="/">{t("errors.notFound.goHome")}</Link>
      </Button>
    </div>
  )
}
