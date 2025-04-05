import { cn } from "@renderer/lib/utils";
import { Button } from "@renderer/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
} from "@renderer/components/ui";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import {
  useAuthStore,
  type LoginMethodType,
} from "@/renderer/store/use-auth-store";
import { useAppStore } from "@/renderer/store";
import { useEffect, useRef, useState } from "react";
import { Client } from "@/renderer/api";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const { t } = useTranslation("components/auth");
  const { logingMethod, setLogingMethod, fetchSessions, sessions, login } =
    useAuthStore();

  const handleLogin = (method: LoginMethodType) => {
    setLogingMethod(method);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  if (logingMethod === "email") {
    return <EmailLoginForm />;
  }

  if (
    (["google_oauth2", "github", "mixin"] as LoginMethodType[]).includes(
      logingMethod
    )
  ) {
    return <OauthLoginForm />;
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t("welcome")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {sessions.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-center gap-3">
                  {sessions.map((session) => (
                    <Button
                      key={session.id}
                      variant="outline"
                      className="size-10 rounded-full"
                      onClick={() => login(session)}
                    >
                      <Avatar className="size-10">
                        <AvatarImage src={session.avatarUrl} />
                        <AvatarFallback>
                          {session.name?.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  ))}
                </div>
                <Separator />
                <p className="text-center text-sm text-muted-foreground">
                  {t("continueWithOtherAccount")}
                </p>
              </div>
            )}
            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleLogin("google_oauth2")}
              >
                <Icon icon="cib:google" className="size-4 mr-2 text-red-500" />
                {t("continueWithGoogle")}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleLogin("github")}
              >
                <Icon icon="cib:github" className="size-4 mr-2" />
                {t("continueWithGithub")}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleLogin("mixin")}
              >
                <img src="/assets/mixin-logo.png" className="size-4 mr-2" />
                {t("continueWithMixin")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EmailLoginForm() {
  return <div>EmailLoginForm</div>;
}

function OauthLoginForm() {
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
