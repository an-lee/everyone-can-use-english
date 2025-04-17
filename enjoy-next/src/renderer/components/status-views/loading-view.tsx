import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";

export const LoadingView = () => {
  const { t } = useTranslation("components/status-views");

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 m-auto">
      <Icon
        icon="tabler:loader"
        className="h-6 w-6 animate-spin text-muted-foreground"
      />
      <div className="text-center">
        <p className="text-xs text-muted-foreground">{t("loading")}</p>
      </div>
    </div>
  );
};
