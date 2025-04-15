import { useMediaPlayer } from "@/renderer/store";
import { cn, secondsToTimestamp } from "@renderer/lib/utils";
import { useEffect, useRef } from "react";

export function TranscriptionSentence(props: {
  sentence: TimelineEntry;
  index: number;
  onClick: () => void;
}) {
  const { sentence, index, onClick } = props;

  return (
    <div
      className="flex flex-col p-4 rounded-lg cursor-pointer hover:bg-muted"
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

export function TranscriptionActiveSentence(props: {
  sentence: TimelineEntry;
  index: number;
}) {
  const { sentence, index } = props;
  const { currentTime } = useMediaPlayer();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [sentence, ref]);

  return (
    <div ref={ref} className="flex flex-col p-4 rounded-lg bg-background">
      <div className="flex items-center gap-2">
        <div className="text-sm text-muted-foreground font-mono">
          #{index + 1}
        </div>
        <div className="text-xs text-muted-foreground">
          {secondsToTimestamp(sentence.startTime)} ~{" "}
          {secondsToTimestamp(sentence.endTime)}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {props.sentence.timeline?.map((entry, index) => {
          if (!entry.timeline) return null;
          return (
            <TranscriptionWord
              key={`word-${index}`}
              word={entry}
              active={
                currentTime >= entry.startTime && currentTime <= entry.endTime
              }
            />
          );
        })}
      </div>
    </div>
  );
}

export function TranscriptionWord(props: {
  word: TimelineEntry;
  active: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div
        className={cn(
          "font-serif text-lg min-w-max border-b-2 border-transparent",
          props.active && "border-red-500"
        )}
      >
        {props.word.text}
      </div>
      <div className="flex items-center gap-1 min-w-max h-4">
        {props.word.timeline?.map((entry, index) => {
          if (!entry.timeline) return null;
          return <TranscriptionToken key={index} token={entry} />;
        })}
      </div>
    </div>
  );
}

export function TranscriptionToken(props: { token: TimelineEntry }) {
  return (
    <div className="text-sm text-muted-foreground font-code min-w-max">
      {props.token.text}
    </div>
  );
}
