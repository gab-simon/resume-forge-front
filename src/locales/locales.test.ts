import { describe, expect, it } from "vitest"
import { LANGUAGES } from "@/lib/i18n"
import enUS from "./en-US.json"
import ptBR from "./pt-BR.json"

// The typecheck validates t() keys against en-US.json only. These tests keep
// the other locale files in step with it.

const LOCALES: Record<(typeof LANGUAGES)[number], unknown> = {
  "en-US": enUS,
  "pt-BR": ptBR,
}

/** Maps each dotted key, such as "items.toast.created", to its text. */
function flatten(value: unknown, prefix = ""): Map<string, string> {
  const entries = new Map<string, string>()
  if (typeof value === "string") {
    entries.set(prefix, value)
    return entries
  }
  if (typeof value !== "object" || value === null) {
    throw new Error(`"${prefix}" is neither a text nor an object`)
  }
  for (const [key, child] of Object.entries(value)) {
    const path = prefix === "" ? key : `${prefix}.${key}`
    for (const [childPath, text] of flatten(child, path)) {
      entries.set(childPath, text)
    }
  }
  return entries
}

/** The {{variables}} and <tags> of a text, sorted. */
function placeholders(text: string): string[] {
  return [...text.matchAll(/\{\{\s*(\w+)\s*\}\}|<(\w+)>/g)]
    .map((match) => match[1] ?? `<${match[2]}>`)
    .sort()
}

const reference = flatten(enUS)

describe.each(LANGUAGES.filter((language) => language !== "en-US"))(
  "locale %s",
  (language) => {
    const locale = flatten(LOCALES[language])

    it("has the same keys as en-US", () => {
      expect([...locale.keys()].sort()).toEqual([...reference.keys()].sort())
    })

    it("uses the same variables and tags as en-US in each text", () => {
      const different = [...reference]
        .filter(
          ([key, text]) =>
            placeholders(text).join() !==
            placeholders(locale.get(key) ?? "").join(),
        )
        .map(([key]) => key)

      expect(different).toEqual([])
    })
  },
)

describe("every locale", () => {
  it.each(LANGUAGES)("%s has no empty text", (language) => {
    const empty = [...flatten(LOCALES[language])]
      .filter(([, text]) => text.trim() === "")
      .map(([key]) => key)

    expect(empty).toEqual([])
  })
})
