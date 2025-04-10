import { useAppStore } from "@renderer/store";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { LoadingView } from "./loading-view";

export const AppInitializingView = () => {
  const { appState } = useAppStore();

  if (appState.status === "initializing") {
    return <InitializingView progress={appState.progress} />;
  } else if (appState.status === "initializing_error") {
    return <InitializingErrorView error={appState.error} />;
  } else if (appState.status === "ready") {
  } else {
    return <LoadingView />;
  }
};

const InitializingView = ({
  progress,
}: {
  progress: InitializationProgress;
}) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
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
    </div>
  );
};

const InitializingErrorView = ({
  error = "Unknown error",
  message = "We couldn't initialize the application. Please try again.",
}: {
  error?: string;
  message?: string;
}) => {
  const { t } = useTranslation("components/status-views");

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <Icon icon="mdi:alert-circle" className="h-12 w-12 text-destructive" />
      <div className="text-center">
        <p className="text-lg font-medium">
          {t("errorInitializingApplication")}
        </p>
        {error && (
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
        )}
        <button
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          onClick={() => window.location.reload()}
        >
          {t("retry")}
        </button>
      </div>
    </div>
  );
};
