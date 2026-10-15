import { CircleAlert } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"

interface ErrorStateProps {
  /** Already translated. Defaults to a generic title. */
  title?: string
  message: string
  onRetry?: () => void
}

/** Inline error for a failed query, with an optional retry button. */
export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  const { t } = useTranslation()

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-2 py-12 text-center"
    >
      <div className="mb-2 rounded-full bg-destructive/10 p-4">
        <CircleAlert className="size-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold">{title ?? t("errors.loadData")}</h3>
      <p className="text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" className="mt-2" onClick={onRetry}>
          {t("common.tryAgain")}
        </Button>
      )}
    </div>
  )
}
