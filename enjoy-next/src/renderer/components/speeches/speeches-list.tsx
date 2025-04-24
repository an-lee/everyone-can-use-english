import { useSpeechQueries } from "@renderer/hooks";
import {
  EmptyView,
  ErrorView,
  LoadingView,
} from "@renderer/components/status-views";
import { SpeechPlayer } from "./speech-player";
import { useState } from "react";
import { Icon } from "@iconify/react";
import { Button, Input } from "@renderer/components/ui";
import { useTranslation } from "react-i18next";
import { useDebounce } from "@uidotdev/usehooks";

export function SpeechesList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const { data, isLoading, error, isFetching } = useSpeechQueries({
    page,
    search: debouncedSearch,
  });
  const [currentSpeechId, setCurrentSpeechId] = useState<string | null>(null);

  const { t } = useTranslation("components/speeches");

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
    <div className="">
      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="text-sm text-muted-foreground min-w-max">
          {t("generatedSpeeches")}:
        </div>
        <Input
          className="w-full max-w-48"
          placeholder={t("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {data?.items.map((speech: SpeechEntity) => (
        <SpeechPlayer
          key={speech.id}
          speech={speech}
          currentSpeechId={currentSpeechId}
          setCurrentSpeechId={setCurrentSpeechId}
        />
      ))}
      <div className="flex items-center justify-center gap-2">
        <Button
          disabled={page === 1 || isFetching}
          variant="ghost"
          onClick={() => setPage(page - 1)}
        >
          <Icon icon="tabler:chevron-left" />
        </Button>
        <span className="text-sm">{page}</span>
        <span className="text-sm">/</span>
        <span className="text-sm">{data?.totalPages}</span>
        <Button
          disabled={page === data?.totalPages || isFetching}
          variant="ghost"
          onClick={() => setPage(page + 1)}
        >
          <Icon icon="tabler:chevron-right" />
        </Button>
      </div>
    </div>
  );
}
