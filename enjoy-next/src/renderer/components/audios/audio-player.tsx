import { Icon } from "@iconify/react";
import { Button } from "@renderer/components/ui/button";
import { useMediaPlayer } from "@renderer/store/use-media-player";
import { useEffect } from "react";
import { Slider } from "../ui/slider";
import { secondsToTimestamp } from "@/renderer/lib/utils";
import { useMediaControls } from "@/renderer/hooks/use-media-controls";

export function AudioPlayer(props: { audio: AudioEntity }) {
  const { audio } = props;
  const { ref, togglePlay, destroy } = useMediaControls(audio.src!);
  const { currentTime, duration, isPlaying, loading, seeking, interactable } =
    useMediaPlayer();

  useEffect(() => {
    console.log("audio-player", audio.src);
    return () => {
      destroy();
    };
  }, [audio.src]);

  return (
    <div className="flex flex-col h-full">
      <div className="">
        <Slider
          disabled={loading || seeking || !interactable}
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
      <div className="flex-1 flex items-center justify-center gap-2">
        <Button
          onClick={togglePlay}
          variant="secondary"
          size="icon"
          className="rounded-full"
          disabled={loading || seeking || !audio?.src || !interactable}
        >
          {!interactable ? (
            <Icon icon="tabler:loader-2" className="animate-spin" />
          ) : isPlaying ? (
            <Icon icon="tabler:player-pause-filled" />
          ) : (
            <Icon icon="tabler:player-play-filled" />
          )}
        </Button>
        <div className="text-sm text-muted-foreground min-w-max">
          {secondsToTimestamp(currentTime)} / {secondsToTimestamp(duration)}
        </div>
        <audio ref={ref} preload="auto" className="hidden" />
      </div>
    </div>
  );
}
