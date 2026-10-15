import "i18next"
import type enUS from "@/locales/en-US.json"

// Types the keys of t() from the English locale file, so a key that does not
// exist fails the typecheck.
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation"
    resources: { translation: typeof enUS }
  }
}
