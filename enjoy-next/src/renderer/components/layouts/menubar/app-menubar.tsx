import { Menubar, Button } from "@renderer/components/ui";
import { MENUBAR_HEIGHT } from "@/renderer/components/layouts/config";
import { useSystem } from "@renderer/hooks/use-system";
import { useAuthStore } from "@renderer/store";
import {
  AuthenticatedLeftMenu,
  AuthenticatedRightMenu,
  UnauthenticatedLeftMenu,
  UnauthenticatedRightMenu,
  WindowController,
} from "@renderer/components/layouts/menubar";

export const AppMenubar = (props: { isAuthenticated: boolean }) => {
  const { isAuthenticated } = props;
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
        {isAuthenticated ? (
          <AuthenticatedLeftMenu />
        ) : (
          <UnauthenticatedLeftMenu />
        )}
      </div>
      <div className="non-draggable-region ml-auto">
        {isAuthenticated ? (
          <AuthenticatedRightMenu />
        ) : (
          <UnauthenticatedRightMenu />
        )}
        {system !== "macos" && <WindowController />}
      </div>
    </Menubar>
  );
};
