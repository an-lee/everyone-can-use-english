import { Icon } from "@iconify/react";
import { Toaster } from "@renderer/components/ui";
import { useTranslation } from "react-i18next";

export const ErrorView = ({ error }: { error: string }) => {
  const { t } = useTranslation("components/status-views");

  return (
    <div className="flex h-[100svh] w-screen flex-col items-center justify-center gap-4">
      <Icon icon="mdi:alert-circle" className="h-12 w-12 text-destructive" />
      <div className="text-center">
        <p className="text-lg font-medium">{t("somethingWentWrong")}</p>
        {error && <p className="mt-1 text-sm text-muted-foreground">{error}</p>}
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
