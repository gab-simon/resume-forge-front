import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { LANGUAGE_NAMES, LANGUAGES } from "@/lib/i18n"

// The sidebar LanguageToggle needs the sidebar provider, which the login page
// does not have. The language chosen here also sets the language of the
// email with the code.
export function LoginLanguageSwitcher() {
  const { t, i18n } = useTranslation()

  return (
    <nav aria-label={t("language.label")} className="flex justify-center gap-1">
      {LANGUAGES.map((language) => (
        <Button
          key={language}
          type="button"
          variant="ghost"
          size="sm"
          lang={language}
          aria-pressed={language === i18n.language}
          className="text-muted-foreground aria-pressed:text-foreground"
          onClick={() => void i18n.changeLanguage(language)}
        >
          {LANGUAGE_NAMES[language]}
        </Button>
      ))}
    </nav>
  )
}
