import { usePlayerSettingStore } from "@renderer/store";
import { cn, secondsToTimestamp } from "@renderer/lib/utils";
import { useEffect, useRef, useState } from "react";
import { TranscriptionSentenceDetails } from "./transcription-sentence-details";
import { Translation } from "../shared";
import { useRecordingsByTarget } from "@/renderer/hooks/use-recording";
import { Icon } from "@iconify/react";
import { useIntersectionObserver } from "@uidotdev/usehooks";

export function TranscriptionSentence(props: {
  targetId: string;
  targetType: RecordingEntity["targetType"];
  sentence: TimelineEntry;
  index: number;
  active: boolean;
  onClick: () => void;
  selectWord: (wordIndex: number) => void;
}) {
  const { targetId, targetType, sentence, index, active, onClick, selectWord } =
    props;
  const [shown, setShown] = useState(false);

  const [inViewRef, entry] = useIntersectionObserver({
    threshold: 0,
    root: null,
    rootMargin: "0px",
  });
  const { playMode, displayTranslation } = usePlayerSettingStore();
  const { data: recordings } = useRecordingsByTarget({
    targetId,
    targetType,
    referenceId: index,
    enabled: shown,
  });

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (!active) return;

    ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [ref, active]);

  useEffect(() => {
    if (!shown && entry?.isIntersecting) {
      setShown(true);
    }
  }, [entry?.isIntersecting]);

  return (
    <div
      className={cn(
        "relative",
        playMode === "shadowMode" && active && "border border-dashed rounded-lg"
      )}
      ref={inViewRef}
    >
      <div
        ref={ref}
        className={cn(
          "flex flex-col p-4 rounded-lg cursor-pointer gap-2",
          playMode === "readMode" && active
            ? "bg-background"
            : "hover:bg-muted",
          playMode === "shadowMode" && active && "pb-2"
        )}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground">#{index + 1}</div>
            <div className="text-xs text-muted-foreground">
              {secondsToTimestamp(sentence.startTime)} ~{" "}
              {secondsToTimestamp(sentence.endTime)}
            </div>
          </div>
          {recordings?.length > 0 && (
            <div className="text-xs text-muted-foreground">
              <Icon icon="tabler:microphone" className="size-4 text-blue-500" />
            </div>
          )}
        </div>
        <div className="font-serif text-lg">{sentence.text}</div>
        {playMode === "readMode" && displayTranslation && (
          <div className="mb-2">
            <Translation content={sentence.text} />
          </div>
        )}
      </div>
      {active && playMode === "shadowMode" && (
        <TranscriptionSentenceDetails
          sentence={sentence}
          selectWord={selectWord}
          recording={recordings?.[0]}
        />
      )}
    </div>
  );
}
