import { describe, expect, it } from "vitest"
import { getErrorMessage, isNetworkError } from "./errors"

describe("getErrorMessage", () => {
  it("returns the detail string of a FastAPI HTTPException", () => {
    expect(getErrorMessage({ detail: "Item not found" }, "Fallback")).toBe(
      "Item not found",
    )
  })

  it("returns the first message of a FastAPI validation error", () => {
    const error = {
      detail: [
        { loc: ["body", "title"], msg: "Field required", type: "missing" },
      ],
    }
    expect(getErrorMessage(error, "Fallback")).toBe("Field required")
  })

  it("returns the message of an Error instance", () => {
    expect(getErrorMessage(new TypeError("Failed to fetch"), "Fallback")).toBe(
      "Failed to fetch",
    )
  })

  it("returns the fallback for values it does not recognize", () => {
    expect(getErrorMessage({}, "Fallback")).toBe("Fallback")
    expect(getErrorMessage({ detail: [] }, "Fallback")).toBe("Fallback")
    expect(getErrorMessage(undefined, "Fallback")).toBe("Fallback")
  })
})

describe("isNetworkError", () => {
  it("is true for Error instances and false for parsed response bodies", () => {
    expect(isNetworkError(new TypeError("Failed to fetch"))).toBe(true)
    expect(isNetworkError({ detail: "Not found" })).toBe(false)
  })
})
