// Public data API of the auth feature: session, hooks and schemas. Nothing
// here renders UI, so route loaders and src/main.tsx can import this file
// without pulling the login page into the main bundle.
//
// Public components are exported from ./components/index.ts.
export {
  useRequestLoginCode,
  useSignOut,
  useVerifyLoginCode,
} from "./api/mutations"
export { AuthSessionContext, useAuthSession } from "./api/session-context"
export {
  type LoginSearch,
  loginSearchSchema,
  safeRedirect,
} from "./schemas"
export {
  type AuthSession,
  createAuthSession,
  REFRESH_MARGIN_MS,
  type SessionStorage,
  type StoredSession,
} from "./session"
