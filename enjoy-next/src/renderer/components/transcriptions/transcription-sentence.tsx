import { cn, secondsToTimestamp } from "@renderer/lib/utils";
import { useEffect, useRef } from "react";

export function TranscriptionSentence(props: {
  sentence: TimelineEntry;
  index: number;
  active: boolean;
  onClick: () => void;
}) {
  const { sentence, index, active, onClick } = props;
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    if (!active) return;

    ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [ref, active]);

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col p-4 rounded-lg cursor-pointer",
        active ? "bg-background" : "hover:bg-muted"
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
  );
}
