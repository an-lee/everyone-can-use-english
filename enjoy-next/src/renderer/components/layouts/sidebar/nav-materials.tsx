"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@renderer/components/ui";
import { Icon } from "@iconify/react";
import { Link, useLocation } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export function NavMaterials({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: string;
  }[];
}) {
  const { pathname } = useLocation();
  const { t } = useTranslation("components/layouts/sidebar");

  return (
    <SidebarGroup className="non-draggable-region">
      <SidebarGroupLabel>{t("materials")}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              tooltip={item.title}
              className="cursor-pointer"
              isActive={pathname.startsWith(item.url)}
              asChild
            >
              <Link to={item.url} replace={true}>
                <Icon icon={item.icon || "tabler:playground"} />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
