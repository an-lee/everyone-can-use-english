import { cn } from "@renderer/lib/utils";
import { Button } from "@renderer/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@renderer/components/ui";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const { t } = useTranslation("components/auth");
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t("welcome")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => {
                  window.EnjoyAPI.shell.openExternal(
                    "https://enjoy.bot/auth/google_oauth2?state='123'"
                  );
                }}
                variant="outline"
                className="w-full"
              >
                <Icon icon="cib:google" className="size-4 mr-2 text-red-500" />
                {t("continueWithGoogle")}
              </Button>
              <Button variant="outline" className="w-full">
                <Icon icon="cib:github" className="size-4 mr-2" />
                {t("continueWithGithub")}
              </Button>
              <Button variant="outline" className="w-full">
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
