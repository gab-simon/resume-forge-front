import { type LucideIcon, Monitor, Moon, Sun } from "lucide-react"
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
import type { TranslationKey } from "@/lib/i18n"
import { type Theme, useTheme } from "./theme-provider"

const THEMES: { value: Theme; labelKey: TranslationKey; icon: LucideIcon }[] = [
  { value: "light", labelKey: "theme.light", icon: Sun },
  { value: "dark", labelKey: "theme.dark", icon: Moon },
  { value: "system", labelKey: "theme.system", icon: Monitor },
]

export function ThemeToggle() {
  const { isMobile } = useSidebar()
  const { setTheme, theme } = useTheme()
  const { t } = useTranslation()
  const CurrentIcon =
    THEMES.find((option) => option.value === theme)?.icon ?? Monitor

  return (
    <SidebarMenuItem>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            tooltip={t("theme.label")}
            data-testid="theme-button"
          >
            <CurrentIcon className="size-4 text-muted-foreground" />
            <span>{t("theme.label")}</span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side={isMobile ? "top" : "right"}
          align="end"
          className="min-w-56"
        >
          {THEMES.map(({ value, labelKey, icon: Icon }) => (
            <DropdownMenuItem key={value} onClick={() => setTheme(value)}>
              <Icon className="mr-2 size-4" />
              {t(labelKey)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}
