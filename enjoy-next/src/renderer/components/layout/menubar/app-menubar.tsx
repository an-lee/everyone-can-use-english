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
} from "@renderer/components/ui";
import { MENUBAR_HEIGHT } from "@renderer/components/layout/config";
import { XIcon } from "lucide-react";
import { useSystem } from "@renderer/hooks/use-system";
import { useAppStore, useAuthStore } from "@renderer/store";
import { Icon } from "@iconify/react";

export const AppMenubar = (props: { isAuthenticated?: boolean }) => {
  const { isAuthenticated = useAuthStore.getState().isAuthenticated() } = props;
  const system = useSystem();

  return (
    <Menubar
      style={{ "--menubar-height": MENUBAR_HEIGHT } as React.CSSProperties}
      className="draggable-region border-t-none border-x-none rounded-none bg-sidebar z-50 fixed w-screen inset-0 shadow-none px-0"
    >
      <div
        className={`flex items-center gap-1 non-draggable-region ${system === "macos" ? "ml-16" : "ml-2"}`}
      >
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-none non-draggable-region hover:bg-primary/10"
        >
          <img src="./assets/icon.png" alt="Enjoy" className="size-5" />
        </Button>
        {isAuthenticated && (
          <SidebarTrigger className="size-7 rounded-none px-2" />
        )}
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
      </div>
      <div className="non-draggable-region ml-auto">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Icon icon="lucide:settings" className="size-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[80svw] h-[70svh]">
            <div className="flex flex-col gap-4">Settings</div>
          </DialogContent>
        </Dialog>
        {system !== "macos" && (
          <>
            <Button variant="ghost" size="icon">
              <Icon icon="tabler:minus" className="size-6" />
            </Button>
            <Button variant="ghost" size="icon">
              <Icon icon="tabler:squares" className="size-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="non-draggable-region hover:bg-destructive hover:text-primary-foreground rounded-none cursor-pointer"
            >
              <XIcon className="size-6" />
            </Button>
          </>
        )}
      </div>
    </Menubar>
  );
};
