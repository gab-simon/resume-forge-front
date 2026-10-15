import { describe, expect, it } from "vitest"
import {
  DEFAULT_LANGUAGE,
  detectLanguage,
  getLanguage,
  i18n,
  isLanguage,
  isTranslationKey,
} from "./i18n"

describe("detectLanguage", () => {
  it("uses the stored language before the browser languages", () => {
    expect(detectLanguage("pt-BR", ["en-US"])).toBe("pt-BR")
  })

  it("ignores a stored value that is not a supported language", () => {
    expect(detectLanguage("fr-FR", ["pt-BR"])).toBe("pt-BR")
  })

  it("uses the first browser language that is supported", () => {
    expect(detectLanguage(null, ["fr-FR", "pt-BR", "en-US"])).toBe("pt-BR")
  })

  it("matches another region of a supported language", () => {
    expect(detectLanguage(null, ["pt-PT"])).toBe("pt-BR")
    expect(detectLanguage(null, ["pt"])).toBe("pt-BR")
    expect(detectLanguage(null, ["en-GB"])).toBe("en-US")
  })

  it("ignores the case of the browser tag", () => {
    expect(detectLanguage(null, ["PT-br"])).toBe("pt-BR")
  })

  it("falls back to the default language", () => {
    expect(detectLanguage(null, ["fr-FR"])).toBe(DEFAULT_LANGUAGE)
    expect(detectLanguage(null, [])).toBe(DEFAULT_LANGUAGE)
  })
})

describe("isLanguage", () => {
  it("accepts only the supported tags", () => {
    expect(isLanguage("en-US")).toBe(true)
    expect(isLanguage("pt-BR")).toBe(true)
    expect(isLanguage("en")).toBe(false)
    expect(isLanguage(null)).toBe(false)
  })
})

describe("the configured instance", () => {
  it("translates with interpolation in each language", async () => {
    expect(getLanguage()).toBe("en-US")
    expect(i18n.t("common.actionsFor", { name: "Notebook" })).toBe(
      "Actions for Notebook",
    )

    await i18n.changeLanguage("pt-BR")

    expect(getLanguage()).toBe("pt-BR")
    expect(i18n.t("common.actionsFor", { name: "Notebook" })).toBe(
      "Ações de Notebook",
    )
  })

  it("tells a translation key from a sentence", () => {
    expect(isTranslationKey("auth.validation.emailRequired")).toBe(true)
    expect(isTranslationKey("An item with this name already exists")).toBe(
      false,
    )
    expect(isTranslationKey("Error: request failed")).toBe(false)
  })
})
