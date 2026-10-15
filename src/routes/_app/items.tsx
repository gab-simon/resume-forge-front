import { createFileRoute } from "@tanstack/react-router"
import { APP_NAME } from "@/config/app"
import {
  itemsListOptions,
  itemsSearchSchema,
  resolveItemsSearch,
} from "@/features/items"
import { ItemsPage } from "@/features/items/components"
import { i18n } from "@/lib/i18n"

export const Route = createFileRoute("/_app/items")({
  validateSearch: itemsSearchSchema,
  loaderDeps: ({ search }) => resolveItemsSearch(search),
  // prefetchQuery starts the request while the route chunk downloads. It does
  // not block navigation and never throws, so ItemsPage renders the loading
  // and error states itself.
  loader: ({ context, deps }) => {
    void context.queryClient.prefetchQuery(itemsListOptions(deps))
  },
  head: () => ({ meta: [{ title: `${i18n.t("nav.items")} | ${APP_NAME}` }] }),
  component: ItemsRoute,
})

function ItemsRoute() {
  const pagination = resolveItemsSearch(Route.useSearch())
  const navigate = Route.useNavigate()

  return (
    <ItemsPage
      pagination={pagination}
      onPaginationChange={(next) => navigate({ search: next })}
    />
  )
}
