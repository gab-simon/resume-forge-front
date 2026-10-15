import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  meReadMeQueryKey,
  meUpdateMeMutation,
} from "@/api/generated/@tanstack/react-query.gen"

export function useUpdateMe() {
  const queryClient = useQueryClient()

  return useMutation({
    ...meUpdateMeMutation(),
    // The response is the updated user, so the cache takes it without a
    // second request.
    onSuccess: (user) => queryClient.setQueryData(meReadMeQueryKey(), user),
  })
}
