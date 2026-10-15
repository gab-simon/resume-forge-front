import i18n, { type ParseKeys } from "i18next"
import { initReactI18next } from "react-i18next"
import enUS from "@/locales/en-US.json"
import ptBR from "@/locales/pt-BR.json"

// Each language is a BCP 47 tag with a file of the same name in src/locales.
// The tag is also what Intl.NumberFormat and Intl.DateTimeFormat receive.
export const LANGUAGES = ["en-US", "pt-BR"] as const

export type Language = (typeof LANGUAGES)[number]

export const DEFAULT_LANGUAGE: Language = "en-US"

export const LANGUAGE_STORAGE_KEY = "ui-language"

// A language name is written in that language, so a person who cannot read
// the current one still finds theirs. That is why these are not in the locale
// files.
export const LANGUAGE_NAMES: Record<Language, string> = {
  "en-US": "English (US)",
  "pt-BR": "Português (Brasil)",
}

/** Every key of src/locales/en-US.json, such as "account.toast.saved". */
export type TranslationKey = ParseKeys

export function isLanguage(value: unknown): value is Language {
  return LANGUAGES.some((language) => language === value)
}

function primarySubtag(tag: string): string {
  return tag.split("-")[0]?.toLowerCase() ?? ""
}

/**
 * Picks the language for a new page load. The stored choice wins. Without a
 * valid one, the first browser language that matches is used: an exact tag
 * first, then the same language of another region, so "pt-PT" selects
 * "pt-BR".
 */
export function detectLanguage(
  stored: string | null,
  preferred: readonly string[],
): Language {
  if (isLanguage(stored)) {
    return stored
  }
  for (const tag of preferred) {
    const match =
      LANGUAGES.find(
        (language) => language.toLowerCase() === tag.toLowerCase(),
      ) ??
      LANGUAGES.find(
        (language) => primarySubtag(language) === primarySubtag(tag),
      )
    if (match) {
      return match
    }
  }
  return DEFAULT_LANGUAGE
}

interface I18nConfig {
  language: Language
  /** Called after every change of language, but not for the initial one. */
  onLanguageChange?: (language: Language) => void
}

/**
 * Starts i18next. Call it once, before the first render. The browser values
 * (stored choice, navigator.languages, the lang attribute) stay in
 * src/main.tsx, so this module also runs in tests and outside a browser.
 */
export function configureI18n({ language, onLanguageChange }: I18nConfig) {
  void i18n.use(initReactI18next).init({
    resources: {
      "en-US": { translation: enUS },
      "pt-BR": { translation: ptBR },
    },
    lng: language,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: [...LANGUAGES],
    // React escapes the text it renders.
    interpolation: { escapeValue: false },
    // The resources are in the bundle, so init finishes before it returns
    // and no component has to suspend.
    initAsync: false,
    react: { useSuspense: false },
  })

  if (onLanguageChange) {
    i18n.on("languageChanged", (next) => {
      if (isLanguage(next)) {
        onLanguageChange(next)
      }
    })
  }
}

/** The language in use. Pass it to Intl formatters. */
export function getLanguage(): Language {
  return isLanguage(i18n.language) ? i18n.language : DEFAULT_LANGUAGE
}

/**
 * True when the text is a key of the locale files. Form errors use it: a Zod
 * schema stores a key as its message, while an error set from an API response
 * is already a sentence.
 */
export function isTranslationKey(value: string): value is TranslationKey {
  return i18n.exists(value)
}

export { i18n }
