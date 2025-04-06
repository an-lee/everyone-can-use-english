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
  AlertDialogDescription,
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  DialogTitle,
  DialogDescription,
} from "@renderer/components/ui";
import { MENUBAR_HEIGHT } from "@/renderer/components/layouts/config";
import { XIcon } from "lucide-react";
import { useSystem } from "@renderer/hooks/use-system";
import { useAuthStore } from "@renderer/store";
import { Icon } from "@iconify/react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Settings } from "@renderer/components/settings";

export const AppMenubar = (props: { isAuthenticated?: boolean }) => {
  const { isAuthenticated = useAuthStore.getState().isAuthenticated() } = props;
  const system = useSystem();
  const [isMaximized, setIsMaximized] = useState(false);
  const { t } = useTranslation("components/layouts/menubar");

  useEffect(() => {
    // Get initial window state
    const getWindowState = async () => {
      try {
        const maximized = await window.EnjoyAPI.window.isMaximized();
        setIsMaximized(maximized);
      } catch (error) {
        console.error("Failed to get window state:", error);
      }
    };

    getWindowState();

    // Listen for window state changes from main process
    const handleWindowStateChanged = (maximized: boolean) => {
      setIsMaximized(maximized);
    };

    window.EnjoyAPI.events.on("window-state-changed", handleWindowStateChanged);

    return () => {
      window.EnjoyAPI.events.off(
        "window-state-changed",
        handleWindowStateChanged
      );
    };
  }, []);

  const handleMinimize = () => {
    window.EnjoyAPI.window.minimize();
  };

  const handleMaximize = () => {
    window.EnjoyAPI.window.maximize();
    // The state will be updated via the window-state-changed event
  };

  const handleClose = () => {
    window.EnjoyAPI.window.close();
  };

  return (
    <TooltipProvider>
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
            <DialogContent className="max-w-screen-md xl:max-w-screen-lg h-5/6 p-0">
              <DialogTitle className="hidden">{t("settings")}</DialogTitle>
              <DialogDescription className="hidden">
                {t("settingsDescription")}
              </DialogDescription>
              <Settings />
            </DialogContent>
          </Dialog>
          {system !== "macos" && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleMinimize}>
                    <Icon icon="tabler:minus" className="size-6" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("minimize")}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleMaximize}>
                    <Icon
                      icon={isMaximized ? "tabler:squares" : "tabler:rectangle"}
                      className="size-6"
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isMaximized ? t("restore") : t("maximized")}
                </TooltipContent>
              </Tooltip>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="non-draggable-region hover:bg-destructive hover:text-primary-foreground rounded-none cursor-pointer"
                  >
                    <XIcon className="size-6" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("quit")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("areYouSureToQuitEnjoyApp")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClose}>
                      {t("quit")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </Menubar>
    </TooltipProvider>
  );
};
