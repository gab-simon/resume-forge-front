import { client } from "./generated/client.gen"

export interface ApiClientConfig {
  /** Base URL of the FastAPI back end, without a trailing slash. */
  baseUrl: string
}

/**
 * Configures the generated API client. src/main.tsx calls this once, before it
 * creates the router, because the generated query keys include the base URL.
 *
 * This file must stay free of browser-only APIs (window, document,
 * localStorage, import.meta.env) so a React Native app can reuse it. Values
 * that come from the platform arrive through `config`.
 */
export function configureApiClient(config: ApiClientConfig): void {
  client.setConfig({ baseUrl: config.baseUrl })

  // AUTH: this template ships without authentication. To add it:
  //
  // 1. Add `getToken: () => string | undefined` and `onUnauthorized: () => void`
  //    to ApiClientConfig and pass them from src/main.tsx.
  // 2. Send the token on every request:
  //      client.setConfig({ baseUrl: config.baseUrl, auth: config.getToken })
  //    The generated client adds `Authorization: Bearer <token>` to operations
  //    that declare a security scheme in openapi.json.
  // 3. Handle expired sessions in one place:
  //      client.interceptors.response.use((response) => {
  //        if (response.status === 401) config.onUnauthorized()
  //        return response
  //      })
  //
  // See "Adding authentication" in AGENTS.md for the rest of the steps.
}
