import { useDbStore } from "@/renderer/store";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { LoadingView } from "./loading-view";

const MAX_RETRIES = 5;

export const DbStatusView = () => {
  const { dbState } = useDbStore();

  switch (dbState.state) {
    case "connecting":
      return <DatabaseConnectingView />;
    case "reconnecting":
      return <DatabaseReconnectingView />;
    case "error":
      return <DatabaseErrorView />;
    case "connected":
      return <DatabaseConnectedView />;
    default:
      return <LoadingView />;
  }
};

const DatabaseConnectingView = () => {
  const { t } = useTranslation("components/status-views");

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4">
      <Icon icon="mdi:database" className="h-10 w-10" />
      <div className="text-center">
        <p className="text-lg font-medium">{t("connectingToDatabase")}</p>
        <p className="text-sm text-muted-foreground">{t("pleaseWait")}</p>
      </div>
      <Icon icon="mdi:loading" className="h-6 w-6 animate-spin" />
    </div>
  );
};

const DatabaseReconnectingView = () => {
  const { t } = useTranslation("components/status-views");

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4">
      <Icon icon="mdi:database" className="h-10 w-10" />
      <div className="text-center">
        <p className="text-lg font-medium">{t("reconnectingToDatabase")}</p>
        <p className="text-sm text-muted-foreground">{t("pleaseWait")}</p>
      </div>
      <Icon icon="mdi:loading" className="h-6 w-6 animate-spin" />
    </div>
  );
};

const DatabaseErrorView = () => {
  const { t } = useTranslation("components/status-views");
  const { dbState } = useDbStore();
  const { error, retryCount, retryDelay } = dbState;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4">
      <Icon icon="mdi:database-alert" className="h-10 w-10 text-destructive" />
      <div className="text-center">
        <p className="text-lg font-medium">{t("databaseError")}</p>
        <p className="text-sm text-muted-foreground">{error}</p>

        {retryCount && retryDelay ? (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground">
              Retry attempt {retryCount} of {MAX_RETRIES}
            </p>
            <div className="mt-2 flex h-1.5 w-48 items-center overflow-hidden rounded-full bg-muted">
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
  );
};
const DatabaseConnectedView = () => {
  const { t } = useTranslation("components/status-views");

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4">
      <Icon icon="tabler:check-circle" className="h-10 w-10 text-success" />
      <div className="text-center">
        <p className="text-lg font-medium">{t("databaseConnected")}</p>
      </div>
    </div>
  );
};
