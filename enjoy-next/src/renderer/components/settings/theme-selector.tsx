import { Button } from "@renderer/components/ui/button";
import { useSettingsStore } from "@renderer/store";
import { MoonIcon, SunIcon, ComputerIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

type ThemeOption = {
  value: "light" | "dark" | "system";
  label: string;
  icon: React.ReactNode;
};

export function ThemeSelector() {
  const { theme, setTheme } = useSettingsStore();
  const { t } = useTranslation("components/settings");

  const themeOptions: ThemeOption[] = [
    {
      value: "light",
      label: t("lightTheme"),
      icon: <SunIcon className="h-4 w-4" />,
    },
    {
      value: "dark",
      label: t("darkTheme"),
      icon: <MoonIcon className="h-4 w-4" />,
    },
    {
      value: "system",
      label: t("systemTheme"),
      icon: <ComputerIcon className="h-4 w-4" />,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {themeOptions.map((option) => (
        <Button
          key={option.value}
          variant={theme === option.value ? "default" : "outline"}
          size="sm"
          className="flex items-center justify-center gap-2 h-9"
          onClick={() => setTheme(option.value)}
        >
          {option.icon}
          <span className="text-xs">{option.label}</span>
        </Button>
      ))}
    </div>
  );
}
