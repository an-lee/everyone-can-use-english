import { useSpeechQueries } from "@renderer/hooks";
import {
  EmptyView,
  ErrorView,
  LoadingView,
} from "@renderer/components/status-views";
import { SpeechPlayer } from "./speech-player";
export function Speeches() {
  const { data, isLoading, error } = useSpeechQueries();

  if (isLoading) {
    return <LoadingView />;
  }

  if (error) {
    return <ErrorView error={error.message} />;
  }

  if (data?.items.length === 0) {
    return <EmptyView />;
  }

  return (
    <div className="flex flex-col gap-4">
      {data?.items.map((speech: SpeechEntity) => (
        <SpeechPlayer key={speech.id} speech={speech} />
      ))}
    </div>
  );
}
