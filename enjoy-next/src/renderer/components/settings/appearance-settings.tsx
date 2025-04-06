import { useTranslation } from "react-i18next";
import { Separator } from "@renderer/components/ui/separator";
import { PaletteIcon } from "lucide-react";
import { ThemeSelector } from "./theme-selector";
import { LanguageSelector } from "./language-selector";
import { FontSizeSelector } from "./font-size-selector";

export function AppearanceSettings() {
  const { t } = useTranslation("components/settings");

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-medium flex items-center gap-2">
          <PaletteIcon className="h-4 w-4" />
          {t("appearance")}
        </h2>
        <p className="text-xs text-muted-foreground">
          {t("appearanceDescription")}
        </p>
      </div>

      <div className="space-y-6">
        {/* Theme Settings */}
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium">{t("themeSettings")}</h3>
            <p className="text-xs text-muted-foreground">
              {t("themeDescription")}
            </p>
          </div>
          <ThemeSelector />
        </div>

        <Separator />

        {/* Language Settings */}
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium">{t("languageSettings")}</h3>
            <p className="text-xs text-muted-foreground">
              {t("languageDescription")}
            </p>
          </div>
          <LanguageSelector />
        </div>

        <Separator />

        {/* Text Settings */}
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium">{t("textSettings")}</h3>
            <p className="text-xs text-muted-foreground">
              {t("textSettingsDescription")}
            </p>
          </div>
          <FontSizeSelector />
        </div>
      </div>
    </div>
  );
}
