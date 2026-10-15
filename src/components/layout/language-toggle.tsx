import { Check, Languages } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { LANGUAGE_NAMES, LANGUAGES } from "@/lib/i18n"

export function LanguageToggle() {
  const { isMobile } = useSidebar()
  const { t, i18n } = useTranslation()

  return (
    <SidebarMenuItem>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            tooltip={t("language.label")}
            data-testid="language-button"
          >
            <Languages className="size-4 text-muted-foreground" />
            <span>{t("language.label")}</span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side={isMobile ? "top" : "right"}
          align="end"
          className="min-w-56"
        >
          {LANGUAGES.map((language) => (
            <DropdownMenuItem
              key={language}
              lang={language}
              onClick={() => void i18n.changeLanguage(language)}
            >
              <Check
                className={
                  language === i18n.language
                    ? "mr-2 size-4"
                    : "mr-2 size-4 invisible"
                }
              />
              {LANGUAGE_NAMES[language]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}
