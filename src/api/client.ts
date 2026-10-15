import { client } from "./generated/client.gen"

export interface ApiClientConfig {
  /** Base URL of the FastAPI back end, without a trailing slash. */
  baseUrl: string
  /**
   * Access token for operations that declare a security scheme in
   * openapi.json. The generated client adds `Authorization: Bearer <token>`.
   */
  getToken?: () => Promise<string | undefined>
  /**
   * Called when an authenticated operation answers 401: the session expired
   * or was revoked. Login operations also answer 401 for a wrong code, and
   * they do not call it.
   */
  onUnauthorized?: () => void
}

let unauthorizedInterceptor: number | undefined

/**
 * Configures the generated API client. src/main.tsx calls this once, before it
 * creates the router, because the generated query keys include the base URL.
 *
 * This file must stay free of browser-only APIs (window, document,
 * localStorage, import.meta.env) so a React Native app can reuse it. Values
 * that come from the platform arrive through `config`.
 */
export function configureApiClient(config: ApiClientConfig): void {
  client.setConfig({ baseUrl: config.baseUrl, auth: config.getToken })

  if (unauthorizedInterceptor !== undefined) {
    client.interceptors.response.eject(unauthorizedInterceptor)
    unauthorizedInterceptor = undefined
  }
  const { onUnauthorized } = config
  if (onUnauthorized) {
    unauthorizedInterceptor = client.interceptors.response.use(
      (response, _request, options) => {
        if (response.status === 401 && options.security?.length) {
          onUnauthorized()
        }
        return response
      },
    )
  }
}
