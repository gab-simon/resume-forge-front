import {
  Link,
  type LinkProps,
  useLocation,
  useNavigate,
} from "@tanstack/react-router"
import { Home, type LucideIcon, Settings } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { APP_NAME } from "@/config/app"
import { UserMenu } from "@/features/account/components"
import type { TranslationKey } from "@/lib/i18n"
import { LanguageToggle } from "./language-toggle"
import { ThemeToggle } from "./theme-toggle"

interface NavItem {
  titleKey: TranslationKey
  to: NonNullable<LinkProps["to"]>
  icon: LucideIcon
}

// Add one entry here for each new top-level page, and its title to the
// "nav" object of every file in src/locales.
const NAV_ITEMS: NavItem[] = [
  { titleKey: "nav.home", to: "/", icon: Home },
  { titleKey: "nav.settings", to: "/settings", icon: Settings },
]

export function AppSidebar() {
  const { isMobile, setOpenMobile } = useSidebar()
  const pathname = useLocation({ select: (location) => location.pathname })
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-6 group-data-[collapsible=icon]:px-2">
        <Link to="/" className="truncate text-lg font-semibold">
          <span className="group-data-[collapsible=icon]:hidden">
            {APP_NAME}
          </span>
          <span className="hidden group-data-[collapsible=icon]:inline">
            {APP_NAME.charAt(0)}
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.to === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.to)

                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      tooltip={t(item.titleKey)}
                      isActive={isActive}
                      asChild
                    >
                      <Link
                        to={item.to}
                        onClick={() => {
                          if (isMobile) {
                            setOpenMobile(false)
                          }
                        }}
                      >
                        <item.icon />
                        <span>{t(item.titleKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <UserMenu onSignedOut={() => void navigate({ to: "/login" })} />
          <LanguageToggle />
          <ThemeToggle />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
