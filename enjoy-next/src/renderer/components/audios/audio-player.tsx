import { Icon } from "@iconify/react";
import { Button } from "@renderer/components/ui/button";
import { useMediaPlayer } from "@renderer/store/use-media-player";
import { useEffect, useRef } from "react";
import { Slider } from "../ui/slider";
import { secondsToTimestamp } from "@/renderer/lib/utils";
import { useMediaElement } from "@/renderer/hooks";

export function AudioPlayer(props: { audio: AudioEntity }) {
  const { audio } = props;
  const ref = useMediaElement();
  const { currentTime, duration, isPlaying, togglePlay } = useMediaPlayer();

  useEffect(() => {
    if (ref.current && audio.src) {
      ref.current.src = audio.src;
    }
  }, [audio?.src, ref.current]);

  return (
    <div className="flex flex-col h-full">
      <div className="">
        <Slider
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
        >
          {isPlaying ? (
            <Icon icon="tabler:player-pause-filled" />
          ) : (
            <Icon icon="tabler:player-play-filled" />
          )}
        </Button>
        <div className="text-sm text-muted-foreground min-w-max">
          {secondsToTimestamp(currentTime)} / {secondsToTimestamp(duration)}
        </div>
        <audio ref={ref} className="hidden" />
      </div>
    </div>
  );
}
