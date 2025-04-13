import { Icon } from "@iconify/react";
import { Button } from "@renderer/components/ui/button";
import { useMediaPlayer } from "@renderer/store/use-media-player";
import { useEffect, useRef } from "react";
import { Slider } from "../ui/slider";
import { secondsToTimestamp } from "@/renderer/lib/utils";

export function AudioPlayer(props: { audio: AudioEntity }) {
  const { audio } = props;
  const audioRef = useRef<HTMLAudioElement>(null);
  const {
    isPlaying,
    setIsPlaying,
    src,
    setSrc,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
  } = useMediaPlayer();

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  };

  useEffect(() => {
    if (audio.src) {
      setSrc(audio.src);
    }
  }, [audio?.src]);

  useEffect(() => {
    if (audioRef.current && audio.src) {
      audioRef.current.src = audio.src;
    }
  }, [audio?.src, audioRef.current]);

  return (
    <div className="flex flex-col h-full">
      <div className="">
        <Slider
          value={[currentTime]}
          max={duration}
          step={0.1}
          onValueChange={(values) => {
            const value = values[0];
            if (audioRef.current) {
              audioRef.current.currentTime = value;
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
        <audio
          ref={audioRef}
          onTimeUpdate={(e) => {
            setCurrentTime(e.currentTarget.currentTime || 0);
          }}
          onLoadedMetadata={(e) => {
            setDuration(e.currentTarget.duration || 0);
          }}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
          onPause={() => {
            setIsPlaying(false);
          }}
          onPlay={() => {
            setIsPlaying(true);
          }}
          className="hidden"
        />
      </div>
    </div>
  );
}
