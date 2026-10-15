function hasDetail(value: unknown): value is { detail: unknown } {
  return typeof value === "object" && value !== null && "detail" in value
}

function hasMsg(value: unknown): value is { msg: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "msg" in value &&
    typeof value.msg === "string"
  )
}

/**
 * Returns a message a user can read for any error thrown by the API client.
 *
 * The generated client throws the parsed response body for HTTP errors, not an
 * Error instance. FastAPI sends `{ detail: string }` for an HTTPException and
 * `{ detail: [{ loc, msg, type }] }` for a 422 validation error. Network
 * failures arrive as regular Error instances.
 *
 * The fallback is returned when the error carries no message. This file is in
 * the data layer and has no access to the translations, so the component
 * passes the translated text, usually `t("errors.unexpected")`.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (hasDetail(error)) {
    const { detail } = error
    if (typeof detail === "string" && detail.length > 0) {
      return detail
    }
    if (Array.isArray(detail)) {
      const first: unknown = detail[0]
      if (hasMsg(first)) {
        return first.msg
      }
    }
    return fallback
  }
  if (error instanceof Error && error.message.length > 0) {
    return error.message
  }
  return fallback
}

/**
 * True when the request never got an HTTP response (offline, DNS, CORS,
 * connection refused). HTTP error responses are thrown as parsed bodies, so
 * they are not Error instances.
 */
export function isNetworkError(error: unknown): boolean {
  return error instanceof Error
}
