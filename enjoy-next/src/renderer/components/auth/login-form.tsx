import { cn } from "@renderer/lib/utils";
import { Button } from "@renderer/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Separator,
} from "@renderer/components/ui";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import {
  useAuthStore,
  type LoginMethodType,
} from "@/renderer/store/use-auth-store";
import { useEffect } from "react";
import { LoginFormOauth } from "./login-form-oauth";
import { LoginFormCode } from "./login-form-code";

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
    return <LoginFormCode provider="email" />;
  }

  if (logingMethod === "phone") {
    return <LoginFormCode provider="phone" />;
  }

  if (
    (["google_oauth2", "github", "mixin"] as LoginMethodType[]).includes(
      logingMethod
    )
  ) {
    return <LoginFormOauth />;
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
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleLogin("phone")}
              >
                <Icon icon="tabler:phone" className="size-4 mr-2" />
                {t("continueWithPhone")}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleLogin("email")}
              >
                <Icon icon="tabler:mail" className="size-4 mr-2" />
                {t("continueWithEmail")}
              </Button>
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
  const { t } = useTranslation("components/auth");
  const { setLogingMethod } = useAuthStore();
  return (
    <div className="flex flex-col gap-3">
      <Input type="email" placeholder={t("email")} />
      <Input type="password" placeholder={t("password")} />
      <div className="flex items-center justify-center">
        <Button variant="ghost" onClick={() => setLogingMethod(null)}>
          {t("back")}
        </Button>
      </div>
    </div>
  );
}
