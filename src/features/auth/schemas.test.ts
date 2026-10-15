import { describe, expect, it } from "vitest"
import {
  codeFormSchema,
  emailFormSchema,
  loginSearchSchema,
  safeRedirect,
} from "./schemas"

function firstMessage(result: { error?: { issues: { message: string }[] } }) {
  return result.error?.issues[0]?.message
}

describe("emailFormSchema", () => {
  it("accepts an email and trims the spaces", () => {
    expect(emailFormSchema.parse({ email: "  ana@example.com " })).toEqual({
      email: "ana@example.com",
    })
  })

  it("requires the email", () => {
    expect(firstMessage(emailFormSchema.safeParse({ email: "  " }))).toBe(
      "auth.validation.emailRequired",
    )
  })

  it.each(["ana", "ana@", "@example.com"])("rejects %s", (email) => {
    expect(firstMessage(emailFormSchema.safeParse({ email }))).toBe(
      "auth.validation.emailInvalid",
    )
  })
})

describe("codeFormSchema", () => {
  it("removes the spaces of a pasted code", () => {
    expect(codeFormSchema.parse({ code: " 482 913 " })).toEqual({
      code: "482913",
    })
  })

  it.each(["", "12345", "1234567", "abcdef"])("rejects %j", (code) => {
    expect(firstMessage(codeFormSchema.safeParse({ code }))).toBe(
      "auth.validation.codeInvalid",
    )
  })
})

describe("safeRedirect", () => {
  it("keeps a path of the application", () => {
    expect(safeRedirect("/settings?tab=1")).toBe("/settings?tab=1")
  })

  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "settings",
    42,
  ])("drops %j", (value) => {
    expect(safeRedirect(value)).toBeUndefined()
  })

  it("is applied to the login search params", () => {
    expect(loginSearchSchema.parse({ redirect: "//evil.example" })).toEqual({
      redirect: undefined,
    })
    expect(loginSearchSchema.parse({})).toEqual({ redirect: undefined })
  })
})
