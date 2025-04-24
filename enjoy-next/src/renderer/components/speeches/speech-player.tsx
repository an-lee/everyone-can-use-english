import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import {
  Button,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@renderer/components/ui";
import { useEffect, useState } from "react";
import { cn, secondsToTimestamp } from "@/renderer/lib/utils";
import { useSpeechControls } from "@renderer/hooks";

export function SpeechPlayer(props: {
  speech: SpeechEntity;
  currentSpeechId: string | null;
  setCurrentSpeechId: (id: string) => void;
}) {
  const { speech, currentSpeechId, setCurrentSpeechId } = props;
  const [collapsed, setCollapsed] = useState(true);
  const { t } = useTranslation("components/speeches");
  const { currentTime, duration, isPlaying, togglePlay, pause, ref } =
    useSpeechControls();

  useEffect(() => {
    if (currentSpeechId !== speech.id) {
      pause();
    }
  }, [currentSpeechId]);

  return (
    <div
      className={cn(
        "flex items-start gap-4 mb-2 p-4 rounded-lg",
        currentSpeechId === speech.id && "bg-background"
      )}
    >
      <Button
        variant="default"
        size="icon"
        className="size-6 rounded-full"
        onClick={() => {
          if (currentSpeechId !== speech.id) {
            setCurrentSpeechId(speech.id);
          }
          togglePlay();
        }}
      >
        {isPlaying ? (
          <Icon icon="tabler:player-pause-filled" className="!size-4" />
        ) : (
          <Icon icon="tabler:player-play-filled" className="!size-4" />
        )}
      </Button>
      <div className="flex-1">
        <audio ref={ref} src={speech.src} />
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-serif text-muted-foreground">
            {secondsToTimestamp(currentTime)} / {secondsToTimestamp(duration)}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground">
              {speech.configuration.voice} | {speech.configuration.model}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 rounded-full"
                >
                  <Icon icon="tabler:dots" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <Icon icon="tabler:download" />
                  <span>{t("download")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Icon icon="tabler:trash" />
                  <span>{t("delete")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div
          className={cn(
            "font-serif",
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
