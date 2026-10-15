import { createContext, use } from "react"
import type { AuthSession } from "../session"

/** Provided once in src/main.tsx, with the session the API client also uses. */
export const AuthSessionContext = createContext<AuthSession | null>(null)

export function useAuthSession(): AuthSession {
  const session = use(AuthSessionContext)
  if (!session) {
    throw new Error("useAuthSession must be used inside AuthSessionContext")
  }
  return session
}
