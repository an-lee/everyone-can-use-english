import { Button } from "@renderer/components/ui/button";
import { Slider } from "@renderer/components/ui/slider";
import { useSettingsStore } from "@renderer/store";
import { Minus, Plus, Type } from "lucide-react";
import { useTranslation } from "react-i18next";

export function FontSizeSelector() {
  const { fontSize, setFontSize } = useSettingsStore();
  const { t } = useTranslation("components/settings");

  const handleIncrease = () => {
    setFontSize(Math.min(fontSize + 1, 24)); // Maximum font size 24px
  };

  const handleDecrease = () => {
    setFontSize(Math.max(fontSize - 1, 12)); // Minimum font size 12px
  };

  const handleSliderChange = (value: number[]) => {
    setFontSize(value[0]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Type className="h-4 w-4" />
          <span>{t("fontSize")}</span>
        </div>
        <div className="text-sm text-muted-foreground">{fontSize}px</div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={handleDecrease}
          disabled={fontSize <= 12}
        >
          <Minus className="h-4 w-4" />
          <span className="sr-only">{t("decreaseFontSize")}</span>
        </Button>

        <Slider
          value={[fontSize]}
          min={12}
          max={24}
          step={1}
          onValueChange={handleSliderChange}
          className="flex-1"
        />

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={handleIncrease}
          disabled={fontSize >= 24}
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">{t("increaseFontSize")}</span>
        </Button>
      </div>
    </div>
  );
}
