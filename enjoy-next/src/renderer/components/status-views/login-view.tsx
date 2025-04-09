import { AppMenubar } from "@renderer/components/layouts/menubar";
import { LoginForm } from "@renderer/components/auth";
import { useTranslation } from "react-i18next";

export const LoginView = () => {
  const { t } = useTranslation("components/status-views");

  return (
    <div className="flex h-[100svh] w-screen items-center justify-center pt-[var(--menubar-height)]">
      <AppMenubar isAuthenticated={false} />
      <div className="flex w-full max-w-sm flex-col gap-6">
        <LoginForm />
        <div className="mt-6 text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary  ">
          {t("agreeTo")}
          <a href="#">{t("termsOfService")}</a> and{" "}
          <a href="#">{t("privacyPolicy")}</a>.
        </div>
      </div>
    </div>
  );
};
