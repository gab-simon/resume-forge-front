import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  itemsCreateItemMutation,
  itemsDeleteItemMutation,
  itemsReadItemQueryKey,
  itemsReadItemsQueryKey,
  itemsUpdateItemMutation,
} from "@/api/generated/@tanstack/react-query.gen"

// Each mutation invalidates the cached queries it makes stale. Returning the
// promise from onSuccess keeps the mutation pending until the list refetches,
// so the UI closes a dialog only after the table shows the new data.
//
// itemsReadItemsQueryKey() without arguments matches every cached page.
//
// Toasts and dialog state belong to the components. Pass them as the second
// argument of `mutate`. This file must not import anything visual.

export function useCreateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    ...itemsCreateItemMutation(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: itemsReadItemsQueryKey() }),
  })
}

export function useUpdateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    ...itemsUpdateItemMutation(),
    onSuccess: (_data, variables) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: itemsReadItemsQueryKey() }),
        queryClient.invalidateQueries({
          queryKey: itemsReadItemQueryKey({ path: variables.path }),
        }),
      ]),
  })
}

export function useDeleteItem() {
  const queryClient = useQueryClient()

  return useMutation({
    ...itemsDeleteItemMutation(),
    onSuccess: (_data, variables) => {
      queryClient.removeQueries({
        queryKey: itemsReadItemQueryKey({ path: variables.path }),
      })
      return queryClient.invalidateQueries({
        queryKey: itemsReadItemsQueryKey(),
      })
    },
  })
}
