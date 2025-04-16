import { useMediaTranscription } from "@/renderer/store/use-media-transcription";
import { useMediaPlayer } from "@/renderer/store";
import {
  cn,
  convertWordIpaToNormal,
  secondsToTimestamp,
} from "@renderer/lib/utils";
import { useEffect, useRef } from "react";
import { useMediaFrequencies } from "@/renderer/hooks";

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
  selectWord: (wordIndex: number) => void;
}) {
  const { mediaElement } = useMediaPlayer();

  const { sentence, index, selectWord } = props;
  const { currentTime } = useMediaPlayer();
  const { selectedWords } = useMediaTranscription();
  const ref = useRef<HTMLDivElement>(null);

  const {
    data: frequencies,
    isLoading: frequenciesLoading,
    error: frequenciesError,
  } = useMediaFrequencies(mediaElement?.src || "");

  useEffect(() => {
    if (!ref.current) return;

    ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [sentence, ref]);

  return (
    <div ref={ref} className="flex flex-col p-4 rounded-lg bg-background">
      <div className="flex items-center gap-2 mb-4">
        <div className="text-sm text-muted-foreground font-mono">
          #{index + 1}
        </div>
        <div className="text-xs text-muted-foreground">
          {secondsToTimestamp(sentence.startTime)} ~{" "}
          {secondsToTimestamp(sentence.endTime)}
        </div>
      </div>

      <div className="font-serif text-base italic text-muted-foreground mb-4">
        <p>{sentence.text}</p>
      </div>

      <div className="flex items-center flex-wrap mb-4">
        {props.sentence.timeline?.map((entry, index) => {
          if (!entry.timeline) return null;
          return (
            <TranscriptionWord
              key={`word-${index}`}
              word={entry}
              active={
                currentTime >= entry.startTime && currentTime <= entry.endTime
              }
              selected={selectedWords.includes(index)}
              onClick={() => selectWord(index)}
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
  selected: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        "flex flex-col cursor-pointer select-none px-1 py-0.5",
        props.selected && "bg-red-500/20"
      )}
      onClick={props.onClick}
    >
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
          if (entry.type === "token") {
            return <TranscriptionToken key={index} token={entry} />;
          }
          return null;
        })}
      </div>
    </div>
  );
}

export function TranscriptionToken(props: { token: TimelineEntry }) {
  const ipas = convertWordIpaToNormal(
    props.token.timeline?.map((entry) => entry.text) || []
  );
  return (
    <div className="text-sm text-muted-foreground font-code min-w-max">
      {ipas.join("")}
    </div>
  );
}
