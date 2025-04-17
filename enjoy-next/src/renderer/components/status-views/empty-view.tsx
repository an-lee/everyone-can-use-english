import { Icon } from "@iconify/react";
import { Toaster } from "@renderer/components/ui";
import { useTranslation } from "react-i18next";

export const EmptyView = ({ message }: { message?: string }) => {
  const { t } = useTranslation("components/status-views");

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 m-auto">
      <Icon
        icon="tabler:mood-empty"
        className="h-6 w-6 text-muted-foreground"
      />
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          {message || t("noData")}
        </p>
      </div>
    </div>
  );
};
