import { useAudios } from "@renderer/hooks/use-audio";
import { Icon } from "@iconify/react";
import { EmptyView, ErrorView } from "@renderer/components/status-views";
import { AudioCard } from "@renderer/components/audios/audio-card";
import { LoadingView } from "@/renderer/components/status-views/loading-view";
import {
  Button,
  Input,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@renderer/components/ui";
import { useState } from "react";
import { useDebounce } from "@uidotdev/usehooks";
import { useTranslation } from "react-i18next";

export function AudiosPage() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<
    "created_at" | "updated_at" | "name" | "duration"
  >("updated_at");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const debouncedQuery = useDebounce(query, 500);
  const { data, isLoading, error } = useAudios({
    search: debouncedQuery,
    sort,
    order,
  });

  const { t } = useTranslation("components/audios");

  if (isLoading) {
    return <LoadingView />;
  }

  if (error) {
    return <ErrorView error={error.message} />;
  }

  if (!data || data.items.length === 0) {
    return <EmptyView />;
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-4 mb-4">
        <Select
          value={sort}
          onValueChange={(value) =>
            setSort(value as "created_at" | "updated_at" | "name" | "duration")
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={t("sort_by")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">{t("created_at")}</SelectItem>
            <SelectItem value="updated_at">{t("updated_at")}</SelectItem>
            <SelectItem value="name">{t("name")}</SelectItem>
            <SelectItem value="duration">{t("duration")}</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={order}
          onValueChange={(value) => setOrder(value as "asc" | "desc")}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("order")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">{t("asc")}</SelectItem>
            <SelectItem value="desc">{t("desc")}</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder={t("search")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button>
          <Icon icon="tabler:plus" />
          {t("add_audio")}
        </Button>
      </div>
      <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {data.items.map((item) => (
          <AudioCard key={item.id} audio={item} />
        ))}
      </div>
    </div>
  );
}
