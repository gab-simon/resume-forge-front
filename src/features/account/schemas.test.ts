import { describe, expect, it } from "vitest"
import type { UserResource } from "@/api/generated"
import {
  settingsFormSchema,
  toSettingsFormValues,
  toSettingsPayload,
} from "./schemas"

const user: UserResource = {
  user_id: 1,
  email: "ana@example.com",
  name: null,
  ui_language: "pt-BR",
  resume_language: "pt",
  default_template: "classic",
  created_at: "2026-10-14T12:00:00Z",
}

describe("settingsFormSchema", () => {
  it("accepts the values of a user", () => {
    expect(settingsFormSchema.parse(toSettingsFormValues(user))).toEqual({
      name: "",
      ui_language: "pt-BR",
      resume_language: "pt",
      default_template: "classic",
    })
  })

  it("limits the name to 255 characters", () => {
    const result = settingsFormSchema.safeParse({
      ...toSettingsFormValues(user),
      name: "a".repeat(256),
    })

    expect(result.error?.issues[0]?.message).toBe(
      "account.validation.nameTooLong",
    )
  })

  it("requires a template", () => {
    const result = settingsFormSchema.safeParse({
      ...toSettingsFormValues(user),
      default_template: "",
    })

    expect(result.error?.issues[0]?.message).toBe(
      "account.validation.templateRequired",
    )
  })
})

describe("toSettingsPayload", () => {
  it("sends an empty name as null and keeps the rest", () => {
    expect(toSettingsPayload(toSettingsFormValues(user))).toEqual({
      name: null,
      ui_language: "pt-BR",
      resume_language: "pt",
      default_template: "classic",
    })
  })
})
