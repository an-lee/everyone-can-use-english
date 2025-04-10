import { Icon } from "@iconify/react";
import { Toaster } from "@renderer/components/ui";
import { useTranslation } from "react-i18next";

export const EmptyView = ({ message }: { message?: string }) => {
  const { t } = useTranslation("components/status-views");

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4">
      <Icon
        icon="tabler:mood-empty"
        className="h-10 w-10 text-muted-foreground"
      />
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {message || t("noData")}
        </p>
      </div>
    </div>
  );
};
