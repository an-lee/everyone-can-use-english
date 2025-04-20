import { Button } from "@renderer/components/ui";
import { Icon } from "@iconify/react";
import { useRef } from "react";
import { useRecordingPlaybackStore } from "@renderer/store/use-recording-playback-store";
import { useRecordingControls } from "@renderer/hooks";

export function RecordingPlayButton(props: { recording: RecordingEntity }) {
  const { recording } = props;
  const ref = useRef<HTMLAudioElement | null>(null);
  const { togglePlay } = useRecordingControls({ recording, ref });
  const { isPlaying } = useRecordingPlaybackStore();

  return (
    <Button
      variant="outline"
      className="rounded-full aspect-square size-8"
      onClick={togglePlay}
    >
      {isPlaying ? (
        <Icon icon="tabler:player-pause" className="size-4" />
      ) : (
        <Icon icon="tabler:player-play" className="size-4" />
      )}
      <audio ref={ref} src={recording.src} preload="auto" className="hidden" />
    </Button>
  );
}
