import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";

export const InitializingErrorView = ({
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
