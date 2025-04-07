import { Icon } from "@iconify/react";
import { Toaster } from "@renderer/components/ui";
import { InitStatus } from "@renderer/store/use-app-store";
import { AppMenubar } from "@renderer/components/layouts/menubar";

interface InitializingViewProps {
  initStatus: InitStatus;
}

export const InitializingView = ({ initStatus }: InitializingViewProps) => {
  return (
    <div className="flex h-[100svh] w-screen flex-col items-center justify-center gap-4 pt-[var(--menubar-height)]">
      <AppMenubar isAuthenticated={false} />
      <Icon
        icon="mdi:loading"
        className="h-12 w-12 animate-spin text-primary"
      />
      <div className="text-center">
        <p className="text-lg font-medium">{initStatus.message}</p>
        <div className="mt-2 h-2 w-64 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${initStatus.progress}%` }}
          />
        </div>
      </div>
      <Toaster richColors closeButton position="top-center" />
    </div>
  );
};
