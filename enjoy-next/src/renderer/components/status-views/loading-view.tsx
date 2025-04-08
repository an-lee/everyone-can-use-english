import { Icon } from "@iconify/react";
import { Toaster } from "@renderer/components/ui";
import { useTranslation } from "react-i18next";

export const LoadingView = () => {
  const { t } = useTranslation("components/status-views");

  return (
    <div className="flex h-[100svh] w-screen flex-col items-center justify-center gap-4">
      <Icon icon="tabler:loader" className="h-12 w-12 animate-spin" />
      <div className="text-center">
        <p className="text-lg font-medium">{t("loading")}</p>
      </div>
      <Toaster richColors closeButton position="top-center" />
    </div>
  );
};
