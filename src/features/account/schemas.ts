import { z } from "zod"
import type { UserResource, UserUpdateResource } from "@/api/generated"
import type { TranslationKey } from "@/lib/i18n"

const MESSAGES = {
  nameTooLong: "account.validation.nameTooLong",
  templateRequired: "account.validation.templateRequired",
} as const satisfies Record<string, TranslationKey>

// The limits match UserUpdateResource in openapi.json.
export const settingsFormSchema = z.object({
  name: z.string().trim().max(255, MESSAGES.nameTooLong),
  ui_language: z.enum(["pt-BR", "en-US"]),
  resume_language: z.enum(["pt", "en"]),
  default_template: z.string().min(1, MESSAGES.templateRequired).max(64),
})

export type SettingsFormValues = z.infer<typeof settingsFormSchema>

export function toSettingsFormValues(user: UserResource): SettingsFormValues {
  return {
    name: user.name ?? "",
    ui_language: user.ui_language,
    resume_language: user.resume_language,
    default_template: user.default_template,
  }
}

/** Converts form values to the request body. An empty name becomes null. */
export function toSettingsPayload(
  values: SettingsFormValues,
): UserUpdateResource {
  return { ...values, name: values.name === "" ? null : values.name }
}
