import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";

export const LoadingView = () => {
  const { t } = useTranslation("components/status-views");

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4">
      <Icon
        icon="tabler:loader"
        className="h-10 w-10 animate-spin text-muted-foreground"
      />
      <div className="text-center">
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </div>
    </div>
  );
};
