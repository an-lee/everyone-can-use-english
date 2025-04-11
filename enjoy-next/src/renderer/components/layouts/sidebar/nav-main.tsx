"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@renderer/components/ui";
import { Icon } from "@iconify/react";
import { Link, useLocation, useMatch } from "@tanstack/react-router";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: string;
  }[];
}) {
  const { pathname } = useLocation();
  return (
    <SidebarGroup className="non-draggable-region">
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              tooltip={item.title}
              className="cursor-pointer"
              isActive={pathname === item.url}
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
