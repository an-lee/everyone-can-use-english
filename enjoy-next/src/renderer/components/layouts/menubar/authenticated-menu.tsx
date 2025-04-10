import {
  Menubar,
  MenubarSeparator,
  MenubarShortcut,
  MenubarItem,
  MenubarContent,
  MenubarMenu,
  MenubarTrigger,
  Button,
  SidebarTrigger,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@renderer/components/ui";
import { useTranslation } from "react-i18next";
import { Settings } from "@renderer/components/settings";
import { WindowController } from "./window-controller";
import { Icon } from "@iconify/react";

export const AuthenticatedLeftMenu = () => {
  const { t } = useTranslation("components/layouts/menubar");

  return (
    <>
      <SidebarTrigger className="size-7 rounded-none px-2" />
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            New Tab <MenubarShortcut>⌘T</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>New Window</MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Share</MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Print</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </>
  );
};

export const AuthenticatedRightMenu = () => {
  const { t } = useTranslation("components/layouts/menubar");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Icon icon="tabler:settings" className="size-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-screen-md xl:max-w-screen-lg h-5/6 p-0">
        <DialogTitle className="hidden">{t("settings")}</DialogTitle>
        <DialogDescription className="hidden">
          {t("settingsDescription")}
        </DialogDescription>
        <Settings />
      </DialogContent>
    </Dialog>
  );
};
