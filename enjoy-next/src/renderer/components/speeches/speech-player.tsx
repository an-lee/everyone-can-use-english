import { Icon } from "@iconify/react";
import { PlayIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@renderer/components/ui";
import { useState } from "react";
import { cn } from "@/renderer/lib/utils";

export function SpeechPlayer(props: { speech: SpeechEntity }) {
  const { speech } = props;
  const [collapsed, setCollapsed] = useState(true);
  const { t } = useTranslation("components/speeches");

  return (
    <div className="flex items-start gap-4 mb-2">
      <Button variant="default" size="icon" className="size-6 rounded-full">
        <Icon icon="tabler:player-play-filled" className="!size-4" />
      </Button>
      <div className="flex-1">
        <div className="text-sm font-serif">00:00 / 00:00</div>
        <div
          className={cn(
            "font-serif text-muted-foreground",
            collapsed && "line-clamp-2 cursor-pointer"
          )}
          onClick={() => setCollapsed(!collapsed)}
        >
          {speech.text}
        </div>
      </div>
    </div>
  );
}
