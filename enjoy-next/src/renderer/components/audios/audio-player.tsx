import { Icon } from "@iconify/react";
import { Button, Slider } from "@renderer/components/ui";
import { useMediaPlayBack, useMediaPlayerSetting } from "@renderer/store";
import { useEffect, useState } from "react";
import { secondsToTimestamp } from "@renderer/lib/utils";
import { useMediaControls } from "@renderer/hooks";
import { useTranslation } from "react-i18next";
import { PlayModeButton, TranslationButton } from "@renderer/components/medias";

export function AudioPlayer(props: { audio: AudioEntity }) {
  const { t } = useTranslation("components/audios");

  const [playable, setPlayable] = useState(false);
  const { audio } = props;
  const { ref, togglePlay, destroy, playNextSentence, playPreviousSentence } =
    useMediaControls(audio.src!);

  const {
    currentTime,
    duration,
    isPlaying,
    loading,
    seeking,
    interactable,
    activeRange,
  } = useMediaPlayBack();
  const { playMode, setPlayMode, looping, setLooping } =
    useMediaPlayerSetting();

  useEffect(() => {
    if (!loading && !seeking && interactable) {
      setPlayable(true);
    }
  }, [loading, seeking, interactable]);

  useEffect(() => {
    return () => {
      destroy();
    };
  }, [audio.src]);

  return (
    <div className="flex flex-col h-full">
      <div className="">
        <Slider
          disabled={!playable}
          value={[currentTime]}
          max={duration}
          step={0.1}
          onValueChange={(values) => {
            const value = values[0];
            if (ref.current) {
              ref.current.currentTime = value;
            }
          }}
        />
      </div>
      <div className="grid grid-cols-2 h-full px-4">
        <div className="flex-1 flex items-center gap-1">
          <Button
            onClick={togglePlay}
            variant={isPlaying ? "secondary" : "default"}
            size="icon"
            className="rounded-full"
            disabled={!playable}
          >
            {!playable ? (
              <Icon icon="tabler:loader-2" className="animate-spin" />
            ) : isPlaying ? (
              <Icon icon="tabler:player-pause-filled" />
            ) : (
              <Icon icon="tabler:player-play-filled" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="p-0"
            onClick={playPreviousSentence}
          >
            <Icon icon="tabler:player-skip-back-filled" className="size-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="p-0"
            onClick={playNextSentence}
          >
            <Icon icon="tabler:player-skip-forward-filled" className="size-6" />
          </Button>
          <Button
            variant={looping ? "secondary" : "ghost"}
            size="icon"
            className="p-0"
            onClick={() => setLooping(!looping)}
          >
            {looping ? (
              <Icon icon="tabler:repeat-once" className="size-6" />
            ) : (
              <Icon icon="tabler:repeat-off" className="size-6" />
            )}
          </Button>
          <Button variant="ghost" size="icon" className="p-0">
            <Icon icon="tabler:brand-speedtest" className="size-6" />
          </Button>
          <div className="">
            <div className="text-xs min-w-max">
              {secondsToTimestamp(currentTime)} / {secondsToTimestamp(duration)}
            </div>
            <div className="text-xs min-w-max font-serif text-muted-foreground">
              ({secondsToTimestamp(activeRange.start)} ~{" "}
              {secondsToTimestamp(activeRange.end)})
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-end gap-2">
          {playMode === "readMode" && <TranslationButton />}
          <PlayModeButton />
        </div>
      </div>

      <audio ref={ref} preload="auto" className="hidden" />
    </div>
  );
}
