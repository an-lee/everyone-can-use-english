import {
  useMediaTranscription,
  useMediaPlayBack,
  useMediaPlayerSetting,
} from "@renderer/store";
import { cn, convertWordIpaToNormal } from "@renderer/lib/utils";
import { useEffect, useRef, useMemo, memo } from "react";
import { PitchContour } from "@renderer/components/charts";
import {
  PitchContourButton,
  TranslationButton,
} from "@renderer/components/medias";

export function TranscriptionSentenceDetails(props: {
  sentence: TimelineEntry;
  selectWord: (wordIndex: number) => void;
}) {
  const { sentence, selectWord } = props;
  const { currentTime, src } = useMediaPlayBack();
  const { selectedWords } = useMediaTranscription();
  const ref = useRef<HTMLDivElement>(null);

  const { displayPitchContour } = useMediaPlayerSetting();

  useEffect(() => {
    if (!ref.current) return;

    ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [sentence, ref]);

  // Memoize the word components to avoid unnecessary re-renders
  const wordComponents = useMemo(() => {
    return sentence.timeline?.map((entry, index) => {
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
    });
  }, [sentence.timeline, currentTime, selectedWords, selectWord]);

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-background px-4 py-2 shadow">
      <div className="flex items-center flex-wrap mb-4">{wordComponents}</div>

      {displayPitchContour && (
        <div className="mb-4 w-full">
          <PitchContour
            src={src}
            startTime={sentence.startTime}
            endTime={sentence.endTime}
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        <PitchContourButton />
        <TranslationButton />
      </div>
    </div>
  );
}

// Use React.memo to prevent unnecessary re-renders when props don't change
const TranscriptionWord = memo(function TranscriptionWord(props: {
  word: TimelineEntry;
  active: boolean;
  selected: boolean;
  onClick?: () => void;
}) {
  // Memoize token components to avoid unnecessary re-renders
  const tokenComponents = useMemo(() => {
    return props.word.timeline?.map((entry, index) => {
      if (!entry.timeline) return null;
      if (entry.type === "token") {
        return <TranscriptionToken key={index} token={entry} />;
      }
      return null;
    });
  }, [props.word.timeline]);

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
        {tokenComponents}
      </div>
    </div>
  );
});

// Use React.memo to prevent unnecessary re-renders when props don't change
const TranscriptionToken = memo(function TranscriptionToken(props: {
  token: TimelineEntry;
}) {
  // Memoize the IPA conversion to avoid recalculating on every render
  const ipas = useMemo(() => {
    return convertWordIpaToNormal(
      props.token.timeline?.map((entry) => entry.text) || []
    );
  }, [props.token.timeline]);

  return (
    <div className="text-sm text-muted-foreground font-code min-w-max">
      {ipas.join("")}
    </div>
  );
});
