import { useMediaPlayerSetting } from "@renderer/store";
import { cn, secondsToTimestamp } from "@renderer/lib/utils";
import { useEffect, useRef } from "react";
import { TranscriptionSentenceDetails } from "./transcription-sentence-details";

export function TranscriptionSentence(props: {
  sentence: TimelineEntry;
  index: number;
  active: boolean;
  onClick: () => void;
  selectWord: (wordIndex: number) => void;
}) {
  const { sentence, index, active, onClick, selectWord } = props;
  const { playMode } = useMediaPlayerSetting();

  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    if (!active) return;

    ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [ref, active]);

  return (
    <div
      className={cn(
        "relative",
        playMode === "shadowMode" && active && "border border-dashed rounded-lg"
      )}
    >
      <div
        ref={ref}
        className={cn(
          "flex flex-col p-4 rounded-lg cursor-pointer",
          playMode === "readMode" && active
            ? "bg-background"
            : "hover:bg-muted",
          playMode === "shadowMode" && active && "pb-2"
        )}
        onClick={onClick}
      >
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground font-mono">
            #{index + 1}
          </div>
          <div className="text-xs text-muted-foreground">
            {secondsToTimestamp(sentence.startTime)} ~{" "}
            {secondsToTimestamp(sentence.endTime)}
          </div>
        </div>
        <div className="font-serif text-lg">{sentence.text}</div>
      </div>
      {active && playMode === "shadowMode" && (
        <TranscriptionSentenceDetails
          sentence={sentence}
          selectWord={selectWord}
        />
      )}
    </div>
  );
}
