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
} from "@renderer/components/ui";
import { Icon } from "@iconify/react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

export const WindowController = () => {
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

    window.EnjoyAPI.events.on(
      "window:onStateChanged",
      handleWindowStateChanged
    );

    return () => {
      window.EnjoyAPI.events.off(
        "window:onStateChanged",
        handleWindowStateChanged
      );
    };
  }, []);

  const handleMinimize = () => {
    window.EnjoyAPI.window.minimize();
  };

  const handleMaximize = () => {
    window.EnjoyAPI.window.maximize();
    // The state will be updated via the window:onStateChanged event
  };

  const handleClose = () => {
    window.EnjoyAPI.window.close();
  };

  return (
    <TooltipProvider>
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
              icon={isMaximized ? "tabler:squares" : "tabler:square"}
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
            <Icon icon="tabler:x" className="size-6" />
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
    </TooltipProvider>
  );
};
