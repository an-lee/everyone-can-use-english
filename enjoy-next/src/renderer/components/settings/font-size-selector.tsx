import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Slider } from "@renderer/components/ui/slider";
import { useSettingsStore } from "@renderer/store";
import { TypeIcon } from "lucide-react";

export function FontSizeSelector() {
  const { fontSize, setFontSize } = useSettingsStore();
  const [sliderValue, setSliderValue] = useState<number[]>([fontSize]);
  const { t } = useTranslation("components/settings");

  // Sync state with store
  useEffect(() => {
    setSliderValue([fontSize]);
  }, [fontSize]);

  const handleSliderChange = (value: number[]) => {
    setSliderValue(value);
    setFontSize(value[0]);
  };

  return (
    <div className="flex flex-col space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center text-sm">
          <TypeIcon className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="text-sm">{fontSize}px</span>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-xs text-muted-foreground">12</span>
        <Slider
          value={sliderValue}
          onValueChange={handleSliderChange}
          min={12}
          max={24}
          step={1}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground">24</span>
      </div>
    </div>
  );
}
