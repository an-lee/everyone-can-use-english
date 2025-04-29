import { useChatsQuery, useDeleteChatMutation } from "@renderer/hooks";
import {
  LoadingView,
  ErrorView,
  EmptyView,
} from "@renderer/components/status-views";
import { Icon } from "@iconify/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Button,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "../ui";
import { formatDateTime } from "@/renderer/lib/utils";
import { formatDate } from "@renderer/lib/utils";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";

export function ChatsPage() {
  const [deletingChat, setDeletingChat] = useState<ChatEntity | null>(null);
  const { data, isLoading, error } = useChatsQuery();
  const { t } = useTranslation("components/chats");

  const { mutate: deleteChat, isPending } = useDeleteChatMutation();

  if (isLoading)
    return (
      <div className="min-h-content">
        <LoadingView />
      </div>
    );
  if (error)
    return (
      <div className="min-h-content">
        <ErrorView error={error.message} />
      </div>
    );
  if (!data)
    return (
      <div className="min-h-content">
        <EmptyView />
      </div>
    );

  return (
    <div className="min-h-content p-4 bg-muted">
      <div className="max-w-screen-sm mx-auto">
        <div className="flex flex-col gap-2">
          {data.items.map((chat: ChatEntity) => (
            <div
              key={chat.id}
              className="px-6 py-3 rounded-full bg-background hover:scale-102 transition-all duration-300 flex items-center gap-2 max-w-full"
            >
              <Icon icon="tabler:message-circle" className="size-4 min-w-max" />
              <Link
                to="/chats/$chatId"
                params={{ chatId: chat.id }}
                className="flex-1 overflow-hidden cursor-pointer"
              >
                <div className="text-sm truncate">{chat.name}</div>
                <div className="text-xs text-muted-foreground">
                  {formatDateTime(chat.updatedAt)}
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeletingChat(chat)}
              >
                <Icon icon="tabler:trash" className="size-4 min-w-max" />
              </Button>
            </div>
          ))}
        </div>
        <AlertDialog
          open={deletingChat !== null}
          onOpenChange={() => setDeletingChat(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("delete")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("areYouSureToDeleteChat", {
                  chatName: deletingChat?.name,
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="outline" onClick={() => setDeletingChat(null)}>
                {t("cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (!deletingChat) return;
                  deleteChat(deletingChat.id, {
                    onSettled: () => {
                      setDeletingChat(null);
                    },
                  });
                }}
              >
                {t("delete")}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
