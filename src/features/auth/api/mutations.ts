import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  authenticationRequestAuthenticationCodeMutation,
  authenticationVerifyAuthenticationCodeMutation,
} from "@/api/generated/@tanstack/react-query.gen"
import { useAuthSession } from "./session-context"

// Toasts and navigation belong to the components. Pass them as the second
// argument of `mutate`.

export function useRequestLoginCode() {
  return useMutation(authenticationRequestAuthenticationCodeMutation())
}

export function useVerifyLoginCode() {
  const session = useAuthSession()
  const queryClient = useQueryClient()

  return useMutation({
    ...authenticationVerifyAuthenticationCodeMutation(),
    onSuccess: (issued) => {
      // Data cached for another account must not show up for this one.
      queryClient.clear()
      session.signIn(issued)
    },
  })
}

export function useSignOut() {
  const session = useAuthSession()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => session.signOut(),
    onSettled: () => queryClient.clear(),
  })
}
