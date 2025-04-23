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

export function NavAiTools() {
  const { pathname } = useLocation();
  const { t } = useTranslation("components/layouts/sidebar");

  return (
    <SidebarGroup className="non-draggable-region">
      <SidebarGroupLabel>{t("aiTools")}</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem key="tts">
          <SidebarMenuButton
            tooltip={t("tts")}
            className="cursor-pointer"
            isActive={pathname.startsWith("/tools/tts")}
            asChild
          >
            <Link to="/tools/tts" replace={true}>
              <Icon icon="tabler:text-recognition" />
              <span>{t("tts")}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem key="translate">
          <SidebarMenuButton
            tooltip={t("translate")}
            className="cursor-pointer"
            isActive={pathname.startsWith("/tools/translate")}
            asChild
          >
            <Link to="/tools/translate" replace={true}>
              <Icon icon="tabler:language" />
              <span>{t("translate")}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem key="stt">
          <SidebarMenuButton
            tooltip={t("stt")}
            className="cursor-pointer"
            isActive={pathname.startsWith("/tools/stt")}
            asChild
          >
            <Link to="/tools/stt" replace={true}>
              <Icon icon="tabler:bubble-text" />
              <span>{t("stt")}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem key="more">
          <SidebarMenuButton
            tooltip={t("moreTools")}
            className="cursor-pointer"
            isActive={pathname.endsWith("/tools")}
            asChild
          >
            <Link to="/tools" replace={true}>
              <Icon icon="tabler:dots" />
              <span>{t("moreTools")}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
