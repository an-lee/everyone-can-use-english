"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@renderer/components/ui";
import { Icon } from "@iconify/react";
import { Link, useLocation } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useChatsQuery, useCreateChatMutation } from "@renderer/hooks";
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";

export function NavAiChats() {
  const { pathname } = useLocation();
  const { t } = useTranslation("components/layouts/sidebar");
  const { data, isLoading } = useChatsQuery();
  const { mutate: createChat } = useCreateChatMutation();
  const router = useRouter();

  return (
    <SidebarGroup className="non-draggable-region">
      <SidebarGroupLabel>{t("aiChats")}</SidebarGroupLabel>
      <SidebarMenu>
        {isLoading && <SidebarMenuSkeleton />}
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip={t("newChat")}
            className="cursor-pointer"
            onClick={() =>
              createChat(
                { name: t("newChat") },
                {
                  onSuccess: (chat) => {
                    router.navigate({
                      to: "/chats/$chatId",
                      params: { chatId: chat.id },
                    });
                  },
                  onError: (error) => {
                    toast.error(error.message);
                  },
                }
              )
            }
          >
            <Icon icon="tabler:plus" />
            <span>{t("newChat")}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        {(data?.items || []).slice(0, 3).map((chat: ChatEntity) => (
          <SidebarMenuItem key={chat.id}>
            <SidebarMenuButton
              tooltip={chat.name}
              className="cursor-pointer"
              isActive={pathname.startsWith(`/chats/${chat.id}`)}
              asChild
            >
              <Link
                to="/chats/$chatId"
                params={{ chatId: chat.id }}
                replace={true}
              >
                <Icon icon="tabler:message-circle" />
                <span>{chat.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip={t("moreChats")}
            className="cursor-pointer"
            isActive={pathname.endsWith("/chats")}
            asChild
          >
            <Link to="/chats" replace={true}>
              <Icon icon="tabler:dots" />
              <span>{t("moreChats")}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
