import { useAuthStore } from "@renderer/store";
import { Button, Input } from "@renderer/components/ui";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { Client } from "@renderer/api";
import { toast } from "sonner";
import { Icon } from "@iconify/react";

export function LoginFormCode(props: { provider: "email" | "phone" }) {
  const { provider } = props;
  const { t } = useTranslation("components/auth");
  const { setLogingMethod, login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const emailRef = useRef<HTMLInputElement>(null);

  const handleRequest = () => {
    if (!emailRef.current) return;
    if (!emailRef.current.validity.valid) return;
    if (loading) return;

    setLoading(true);
    const api = new Client();
    const params = provider === "email" ? { email } : { phoneNumber };
    api.auth
      .loginCode(params)
      .then(() => {
        toast.success(t("sendVerificationCodeSuccess"));
        setRequested(true);
        setCountdown(120);
      })
      .catch((err) => {
        emailRef.current!.focus();
        console.error(err);
        toast.error(t("sendVerificationCodeError", { error: err.message }));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleLogin = () => {
    if (!email) return;
    if (!code) return;
    if (loading) return;

    setLoading(true);
    const api = new Client();
    api.auth
      .auth({ provider: "email", email, code })
      .then((user) => {
        login(user);
        toast.success(t("loginSuccess"));
      })
      .catch((err) => {
        console.error(err);
        toast.error(t("loginError", { error: err.message }));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (countdown > 0) {
      setTimeout(() => setCountdown(countdown - 1), 1000);
    }
  }, [countdown]);

  return (
    <div className="flex flex-col gap-3 max-w-64 w-full mx-auto">
      <div className="flex flex-col gap-1">
        <label className="text-sm text-muted-foreground">{t("email")}</label>
        <Input
          ref={emailRef}
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@enjoy.bot"
        />
      </div>
      {requested && (
        <div className="flex flex-col gap-1">
          <label className="text-sm text-muted-foreground">
            {t("verificationCode")}
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <Button
              variant="secondary"
              className="min-w-24"
              disabled={countdown > 0}
              onClick={handleRequest}
            >
              {countdown > 0 ? countdown : t("resend")}
            </Button>
          </div>
        </div>
      )}
      <div className="flex items-center justify-center">
        {requested ? (
          <Button
            disabled={!code || loading}
            variant="default"
            className="w-full"
            onClick={handleLogin}
          >
            {loading && <Icon icon="tabler:loader" className="animate-spin" />}
            {t("verify")}
          </Button>
        ) : (
          <Button
            disabled={!emailRef.current?.validity.valid || loading}
            variant="default"
            className="w-full"
            onClick={handleRequest}
          >
            {loading && <Icon icon="tabler:loader" className="animate-spin" />}
            {t("sendVerificationCode")}
          </Button>
        )}
      </div>

      <div className="flex items-center justify-center">
        <Button variant="ghost" onClick={() => setLogingMethod(null)}>
          {t("back")}
        </Button>
      </div>
    </div>
  );
}
