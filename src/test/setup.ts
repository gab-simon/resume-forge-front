import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach, vi } from "vitest"
import { configureApiClient } from "@/api/client"
import { configureI18n, DEFAULT_LANGUAGE, getLanguage, i18n } from "@/lib/i18n"

// Same base URL as `test.env.VITE_API_URL` in vite.config.ts.
configureApiClient({ baseUrl: "http://api.test" })

// The tests find elements by their English text. A test that needs another
// language calls i18n.changeLanguage, and the hook below restores English.
configureI18n({ language: DEFAULT_LANGUAGE })

afterEach(async () => {
  cleanup()
  vi.unstubAllGlobals()
  if (getLanguage() !== DEFAULT_LANGUAGE) {
    await i18n.changeLanguage(DEFAULT_LANGUAGE)
  }
})

// jsdom does not implement these browser APIs. Radix UI and the theme
// provider call them.
window.matchMedia ??= (query: string): MediaQueryList => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
})

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Element.prototype.hasPointerCapture ??= () => false
Element.prototype.setPointerCapture ??= () => {}
Element.prototype.releasePointerCapture ??= () => {}
Element.prototype.scrollIntoView ??= () => {}
