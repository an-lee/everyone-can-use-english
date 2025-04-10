"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@renderer/components/ui";
import { useAuthStore } from "@/renderer/store";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

export function NavUser() {
  const { isMobile } = useSidebar();
  const { logout, currentUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.invalidate();
      router.navigate({ to: "/login" });
    }
  }, [currentUser]);

  const { t } = useTranslation("components/layouts/sidebar");

  return (
    <SidebarMenu className="non-draggable-region">
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={currentUser?.avatarUrl}
                  alt={currentUser?.name}
                />
                <AvatarFallback className="rounded-lg">
                  {currentUser?.name?.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {currentUser?.name}
                </span>
                <span className="truncate text-xs">{currentUser?.id}</span>
              </div>
              <Icon icon="tabler:chevron-down" className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={currentUser?.avatarUrl}
                    alt={currentUser?.name}
                  />
                  <AvatarFallback className="rounded-lg">
                    {currentUser?.name?.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {currentUser?.name}
                  </span>
                  <span className="truncate text-xs">{currentUser?.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Icon icon="tabler:user" className="size-4" />
                {t("account")}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Icon icon="tabler:credit-card" className="size-4" />
                {t("billing")}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Icon icon="tabler:bell" className="size-4" />
                {t("notifications")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <Icon icon="tabler:logout" className="size-4" />
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
