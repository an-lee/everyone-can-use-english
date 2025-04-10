import { LoginForm } from "@renderer/components/auth";
import { useTranslation } from "react-i18next";

export const LoginView = () => {
  const { t } = useTranslation("components/status-views");

  return (
    <div className="flex flex-col items-center justify-center gap-4">
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
