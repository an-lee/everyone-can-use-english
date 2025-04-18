import { useMediaPlayerSetting } from "@renderer/store";
import { Icon } from "@iconify/react";
import {
  Button,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenu,
  DropdownMenuTrigger,
} from "@renderer/components/ui";
import { useTranslation } from "react-i18next";

export function PlayModeButton() {
  const { t } = useTranslation("components/medias");
  const { playMode, setPlayMode } = useMediaPlayerSetting();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1 [&[data-state=open]>svg]:rotate-180 "
        >
          {t(playMode)}
          <Icon
            icon="tabler:chevron-up"
            className="size-4 transition-transform"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => setPlayMode("shadowMode")}>
          {t("shadowMode")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setPlayMode("readMode")}>
          {t("readMode")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
