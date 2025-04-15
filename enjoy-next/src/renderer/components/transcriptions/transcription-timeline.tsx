import { secondsToTimestamp } from "@renderer/lib/utils";
import { useMediaPlayer } from "@renderer/store/use-media-player";

export function TranscriptionTimeline(props: {
  timeline: Timeline;
  index?: number;
}) {
  const { timeline, index = 0 } = props;

  return (
    <div className="flex flex-col gap-2">
      {timeline.map((entry, i) => {
        if (entry.type === "segment") {
          return (
            <TranscriptionSegment
              key={entry.id}
              segment={entry}
              index={index + i}
            />
          );
        }
        if (entry.type === "paragraph") {
          return (
            <TranscriptionParagraph
              key={entry.id}
              paragraph={entry}
              index={index + i}
            />
          );
        }
        if (entry.type === "sentence") {
          return (
            <TranscriptionSentence
              key={`sentence-${index + i}`}
              sentence={entry}
              index={index + i}
            />
          );
        }
      })}
    </div>
  );
}

function TranscriptionSegment(props: {
  segment: TimelineEntry;
  index: number;
}) {
  return (
    <>
      {props.segment.timeline?.map((entry, index) => {
        if (!entry.timeline) return null;
        return (
          <TranscriptionTimeline
            key={entry.id}
            timeline={entry.timeline}
            index={props.index + index}
          />
        );
      })}
    </>
  );
}

function TranscriptionParagraph(props: {
  paragraph: TimelineEntry;
  index: number;
}) {
  return (
    <>
      {props.paragraph.timeline?.map((entry, index) => {
        if (!entry.timeline) return null;
        return (
          <TranscriptionTimeline
            key={entry.id}
            timeline={entry.timeline}
            index={props.index + index}
          />
        );
      })}
    </>
  );
}

function TranscriptionSentence(props: {
  sentence: TimelineEntry;
  index: number;
}) {
  const { sentence, index } = props;
  const { setActiveRange } = useMediaPlayer();

  return (
    <div
      className="flex flex-col gap-1 py-2 cursor-pointer"
      onClick={() => {
        setActiveRange({ start: sentence.startTime, end: sentence.endTime });
      }}
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
      <div className="flex items-center gap-2 flex-wrap">
        {props.sentence.timeline?.map((entry, index) => {
          if (!entry.timeline) return null;
          return <TranscriptionWord key={`word-${index}`} word={entry} />;
        })}
      </div>
    </div>
  );
}

function TranscriptionWord(props: { word: TimelineEntry }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="font-serif text-lg min-w-max">{props.word.text}</div>
      <div className="flex items-center gap-1 min-w-max">
        {props.word.timeline?.map((entry, index) => {
          if (!entry.timeline) return null;
          return <TranscriptionToken key={index} token={entry} />;
        })}
      </div>
    </div>
  );
}

function TranscriptionToken(props: { token: TimelineEntry }) {
  return (
    <div className="text-xs text-muted-foreground font-mono min-w-max">
      {props.token.text}
    </div>
  );
}
