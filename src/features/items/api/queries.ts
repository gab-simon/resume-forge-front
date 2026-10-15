import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { itemsReadItemsOptions } from "@/api/generated/@tanstack/react-query.gen"
import type { ItemsPagination } from "../schemas"

/**
 * Query options for one page of items. Route loaders and components share
 * this function, so both use the same query key.
 */
export function itemsListOptions({ page, pageSize }: ItemsPagination) {
  return itemsReadItemsOptions({
    query: { offset: (page - 1) * pageSize, limit: pageSize },
  })
}

export function useItemsList(pagination: ItemsPagination) {
  return useQuery({
    ...itemsListOptions(pagination),
    // Keeps the current page on screen while the next page loads.
    placeholderData: keepPreviousData,
  })
}
