import {
  Menubar,
  MenubarSeparator,
  MenubarShortcut,
  MenubarItem,
  MenubarContent,
  MenubarMenu,
  MenubarTrigger,
} from "@renderer/components/ui";
import { MENUBAR_HEIGHT } from "@renderer/components/layout/config";

export const AppMenubar = () => {
  return (
    <Menubar
      style={{ "--menubar-height": MENUBAR_HEIGHT } as React.CSSProperties}
      className="draggable-region border-t-none border-x-none rounded-none bg-sidebar"
    >
      <MenubarMenu>
        <MenubarTrigger className="non-draggable-region">File</MenubarTrigger>
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
    </Menubar>
  );
};
