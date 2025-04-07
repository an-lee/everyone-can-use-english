import { Icon } from "@iconify/react";
import { Toaster } from "@renderer/components/ui";
import { AppMenubar } from "@renderer/components/layouts/menubar";
import { InitializationProgress } from "@renderer/store/use-app-store";

interface InitializingViewProps {
  progress: InitializationProgress;
}

export const InitializingView = ({ progress }: InitializingViewProps) => {
  return (
    <div className="flex h-[100svh] w-screen flex-col items-center justify-center gap-4 pt-[var(--menubar-height)]">
      <AppMenubar isAuthenticated={false} />
      <Icon
        icon="mdi:loading"
        className="h-12 w-12 animate-spin text-primary"
      />
      <div className="text-center">
        <p className="text-lg font-medium">{progress.message}</p>
        <div className="mt-2 h-2 w-64 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progress.progress}%` }}
          />
        </div>
      </div>
      <Toaster richColors closeButton position="top-center" />
    </div>
  );
};
