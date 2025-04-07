import { Icon } from "@iconify/react";
import { Toaster } from "@renderer/components/ui";
import { AppMenubar } from "@renderer/components/layouts/menubar";
import { useDbStore } from "@renderer/store";
import { useTranslation } from "react-i18next";
// Maximum retry attempts for database connection
const MAX_RETRIES = 5;

interface DatabaseErrorViewProps {
  dbError: string | null;
  retryCount?: number;
  retryDelay?: number;
}

export const DatabaseErrorView = ({
  dbError,
  retryCount,
  retryDelay,
}: DatabaseErrorViewProps) => {
  const { t } = useTranslation("components/status-views");

  return (
    <div className="flex h-[100svh] w-screen items-center justify-center pt-[var(--menubar-height)]">
      <AppMenubar isAuthenticated={false} />
      <div className="flex flex-col items-center gap-4">
        <Icon
          icon="mdi:database-alert"
          className="h-10 w-10 text-destructive"
        />
        <div className="text-center">
          <p className="text-lg font-medium">{t("databaseError")}</p>
          <p className="text-sm text-muted-foreground">{dbError}</p>

          {retryCount && retryDelay ? (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground">
                Retry attempt {retryCount} of {MAX_RETRIES}
              </p>
              <div className="mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-amber-500 transition-all duration-500"
                  style={{
                    width: `${(retryCount / MAX_RETRIES) * 100}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <button
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
              onClick={() => useDbStore.getState().connect()}
            >
              {t("retryConnection")}
            </button>
          )}
        </div>
      </div>
      <Toaster richColors closeButton position="top-center" />
    </div>
  );
};
