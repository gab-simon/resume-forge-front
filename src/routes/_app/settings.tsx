import { createFileRoute } from "@tanstack/react-router"
import { APP_NAME } from "@/config/app"
import { meOptions, templatesOptions } from "@/features/account"
import { SettingsPage } from "@/features/account/components"
import { i18n } from "@/lib/i18n"

export const Route = createFileRoute("/_app/settings")({
  // prefetchQuery starts the requests while the route chunk downloads. It
  // never throws, so SettingsPage renders the loading and error states.
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(meOptions())
    void context.queryClient.prefetchQuery(templatesOptions())
  },
  head: () => ({
    meta: [{ title: `${i18n.t("nav.settings")} | ${APP_NAME}` }],
  }),
  component: SettingsPage,
})
