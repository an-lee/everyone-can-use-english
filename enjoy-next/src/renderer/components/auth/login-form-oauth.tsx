import { Client } from "@/renderer/api";
import { useAppStore, useAuthStore } from "@/renderer/store";
import { Icon } from "@iconify/react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@renderer/components/ui";

export function LoginFormOauth() {
  let timer: NodeJS.Timeout | null = null;
  const { logingMethod, setLogingMethod, nonce, login } = useAuthStore();
  const { t } = useTranslation("components/auth");
  const webApiUrl = useAppStore((state) => state.webApiUrl);
  const hasOpenedRef = useRef(false);

  const openOauthUrl = () => {
    const oauthUrl = `${webApiUrl}/auth/${logingMethod}?state=${nonce}`;
    window.EnjoyAPI.shell.openExternal(oauthUrl);
  };

  const pollOauthState = () => {
    console.log("==poll oauth state==", nonce);
    if (!nonce) return;

    const api = new Client();
    timer = setInterval(() => {
      console.log("==polling oauth state==");
      api.auth
        .oauthState(nonce)
        .then((oauthState) => {
          login(oauthState);
        })
        .catch((err) => {
          console.error("==poll oauth state error==", err);
        });
    }, 2000);
  };

  useEffect(() => {
    if (nonce && !hasOpenedRef.current) {
      openOauthUrl();
      hasOpenedRef.current = true;
    }

    pollOauthState();

    return () => {
      if (timer) {
        console.log("==stop polling oauth state==");
        clearInterval(timer);
      }
    };
  }, [nonce]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-center">
        <Icon icon="mdi:loading" className="size-10 animate-spin" />
      </div>
      <div className="flex items-center justify-center">
        <p>{t("pleaseFinishLoginInBrowser")}</p>
      </div>
      <div className="flex items-center justify-center">
        <Button variant="outline" onClick={openOauthUrl}>
          {t("openBrowser")}
        </Button>
      </div>
      <div className="flex items-center justify-center">
        <Button variant="ghost" onClick={() => setLogingMethod(null)}>
          {t("back")}
        </Button>
      </div>
    </div>
  );
}
