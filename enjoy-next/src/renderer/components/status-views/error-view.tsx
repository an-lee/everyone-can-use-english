import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";

export const ErrorView = ({ error }: { error: string }) => {
  const { t } = useTranslation("components/status-views");

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4">
      <Icon icon="tabler:alert-circle" className="h-12 w-12 text-destructive" />
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
    </div>
  );
};
