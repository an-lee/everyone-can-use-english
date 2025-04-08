"use client";

import * as React from "react";
import { NavMain } from "@renderer/components/layouts/sidebar/nav-main";
import { NavMaterials } from "@renderer/components/layouts/sidebar/nav-materials";
import { NavUser } from "@renderer/components/layouts/sidebar/nav-user";
import { AppInfo } from "@renderer/components/layouts/sidebar/app-info";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@renderer/components/ui";
import { useTranslation } from "react-i18next";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation("components/layouts/sidebar");
  const navMain = [
    {
      title: t("home"),
      url: "/",
      icon: "tabler:home",
    },
  ];

  const navMaterials = [
    {
      title: t("audios"),
      url: "/audios",
      icon: "tabler:headphones",
    },
    {
      title: t("videos"),
      url: "/videos",
      icon: "tabler:video",
    },
    {
      title: t("documents"),
      url: "/documents",
      icon: "tabler:file-text",
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <NavUser />
      </SidebarHeader>
      <SidebarContent className="draggable-region">
        <NavMain items={navMain} />
        <NavMaterials items={navMaterials} />
      </SidebarContent>
      <SidebarFooter>
        <AppInfo />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
