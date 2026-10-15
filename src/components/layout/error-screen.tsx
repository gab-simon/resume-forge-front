import { type ErrorComponentProps, useRouter } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"

// Shown when a route throws while loading or rendering.
export function ErrorScreen({ reset }: ErrorComponentProps) {
  const router = useRouter()
  const { t } = useTranslation()

  return (
    <div
      className="flex min-h-svh flex-col items-center justify-center gap-4 p-4 text-center"
      data-testid="error-screen"
    >
      <span className="text-4xl font-bold md:text-6xl">
        {t("errors.page.title")}
      </span>
      <p className="text-lg text-muted-foreground">
        {t("errors.page.description")}
      </p>
      <Button
        onClick={() => {
          reset()
          void router.invalidate()
        }}
      >
        {t("common.tryAgain")}
      </Button>
    </div>
  )
}
