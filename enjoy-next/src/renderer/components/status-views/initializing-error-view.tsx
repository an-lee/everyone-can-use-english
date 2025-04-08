import { Icon } from "@iconify/react";
import { Toaster } from "@renderer/components/ui";
import { AppMenubar } from "@renderer/components/layouts/menubar";
import { useTranslation } from "react-i18next";

export const InitializingErrorView = ({
  error,
  message,
}: {
  error: string;
  message: string;
}) => {
  const { t } = useTranslation("components/status-views");

  return (
    <div className="flex h-[100svh] w-screen flex-col items-center justify-center gap-4 pt-[var(--menubar-height)]">
      <AppMenubar isAuthenticated={false} />
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
      <Toaster richColors closeButton position="top-center" />
    </div>
  );
};
