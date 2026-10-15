import { z } from "zod"
import type { TranslationKey } from "@/lib/i18n"

const MESSAGES = {
  emailRequired: "auth.validation.emailRequired",
  emailInvalid: "auth.validation.emailInvalid",
  codeInvalid: "auth.validation.codeInvalid",
} as const satisfies Record<string, TranslationKey>

// The limit matches AuthenticationChallengeRequestResource in openapi.json.
export const emailFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, MESSAGES.emailRequired)
    .max(320, MESSAGES.emailInvalid)
    .pipe(z.email(MESSAGES.emailInvalid)),
})

export type EmailFormValues = z.infer<typeof emailFormSchema>

// The back end accepts exactly six digits. Spaces typed or pasted between the
// digits are removed before the check.
export const codeFormSchema = z.object({
  code: z
    .string()
    .transform((value) => value.replace(/\s/g, ""))
    .pipe(z.string().regex(/^\d{6}$/, MESSAGES.codeInvalid)),
})

export type CodeFormInput = z.input<typeof codeFormSchema>
export type CodeFormValues = z.output<typeof codeFormSchema>

/**
 * Keeps only a path of this application. A full URL or a "//host" path in
 * the redirect parameter would send the user to another site after login.
 */
export function safeRedirect(value: unknown): string | undefined {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\")
  ) {
    return undefined
  }
  return value
}

export const loginSearchSchema = z.object({
  redirect: z.string().optional().catch(undefined).transform(safeRedirect),
})

export type LoginSearch = z.infer<typeof loginSearchSchema>
