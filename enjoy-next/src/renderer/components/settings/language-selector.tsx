import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@renderer/components/ui/select";
import { GlobeIcon } from "lucide-react";
import { useSettingsStore } from "@/renderer/store";

export function LanguageSelector() {
  const { language, setLanguage, languages } = useSettingsStore();
  const { t } = useTranslation("components/settings");

  return (
    <div className="flex items-center">
      <GlobeIcon className="h-4 w-4 mr-2 text-muted-foreground" />
      <Select value={language} onValueChange={setLanguage}>
        <SelectTrigger className="w-full h-9">
          <SelectValue placeholder={t("selectLanguage")} />
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
