import { Link } from "@tanstack/react-router"
import { LogOut, Settings, UserRound } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useSignOut } from "@/features/auth"
import { useMe } from "../api/queries"

interface UserMenuProps {
  /** Called after the session ends, to leave the authenticated pages. */
  onSignedOut: () => void
}

export function UserMenu({ onSignedOut }: UserMenuProps) {
  const { t } = useTranslation()
  const { isMobile } = useSidebar()
  const me = useMe()
  const signOut = useSignOut()
  const label = me.data?.name ?? me.data?.email ?? t("account.menu.label")

  return (
    <SidebarMenuItem>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton tooltip={label}>
            <UserRound className="size-4 text-muted-foreground" />
            <span className="truncate">{label}</span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side={isMobile ? "top" : "right"}
          align="end"
          className="min-w-56"
        >
          {me.data ? (
            <>
              <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
                {me.data.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
            </>
          ) : null}
          <DropdownMenuItem asChild>
            <Link to="/settings">
              <Settings className="mr-2 size-4" />
              {t("nav.settings")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={signOut.isPending}
            onClick={() =>
              signOut.mutate(undefined, { onSettled: onSignedOut })
            }
          >
            <LogOut className="mr-2 size-4" />
            {t("account.menu.signOut")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}
