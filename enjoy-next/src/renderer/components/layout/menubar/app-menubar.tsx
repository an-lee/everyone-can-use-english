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
} from "@renderer/components/ui";
import { MENUBAR_HEIGHT } from "@renderer/components/layout/config";
import { MaximizeIcon, MinimizeIcon, XIcon } from "lucide-react";
import { useSystem } from "@renderer/hooks/use-system";

export const AppMenubar = () => {
  const system = useSystem();

  return (
    <Menubar
      style={{ "--menubar-height": MENUBAR_HEIGHT } as React.CSSProperties}
      className="draggable-region border-t-none border-x-none rounded-none bg-sidebar z-50 fixed w-screen inset-0 shadow-none px-0"
    >
      <div
        className={`flex items-center gap-1 non-draggable-region ${system === "macos" ? "ml-16" : "ml-2"}`}
      >
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
      </div>
      <div className="non-draggable-region ml-auto">
        {system !== "macos" && (
          <>
            <Button variant="ghost" size="icon">
              <MinimizeIcon className="size-6" />
            </Button>
            <Button variant="ghost" size="icon">
              <MaximizeIcon className="size-6" />
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
