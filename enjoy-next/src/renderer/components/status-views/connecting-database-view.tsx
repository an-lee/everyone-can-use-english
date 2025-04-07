import { Icon } from "@iconify/react";
import { Toaster } from "@renderer/components/ui";
import { AppMenubar } from "@renderer/components/layouts/menubar";
import { useTranslation } from "react-i18next";

export const ConnectingDatabaseView = () => {
  const { t } = useTranslation("components/status-views");

  return (
    <div className="flex h-[100svh] w-screen items-center justify-center pt-[var(--menubar-height)]">
      <AppMenubar isAuthenticated={false} />
      <div className="flex flex-col items-center gap-4">
        <Icon icon="mdi:database" className="h-10 w-10" />
        <div className="text-center">
          <p className="text-lg font-medium">{t("connectingToDatabase")}</p>
          <p className="text-sm text-muted-foreground">{t("pleaseWait")}</p>
        </div>
        <Icon icon="mdi:loading" className="h-6 w-6 animate-spin" />
      </div>
      <Toaster richColors closeButton position="top-center" />
    </div>
  );
};
