import { Icon } from "@iconify/react";
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@renderer/components/ui";
import { useTranslation } from "react-i18next";
import { usePlayerSettingStore } from "@renderer/store";

export function TranslationButton(props: {
  asChild?: boolean;
  children?: React.ReactNode;
}) {
  const { asChild, children } = props;
  const { t } = useTranslation("components/medias");
  const { displayTranslation, setDisplayTranslation } = usePlayerSettingStore();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          onClick={() => setDisplayTranslation(!displayTranslation)}
          asChild
        >
          {asChild ? (
            children
          ) : (
            <Button
              variant={displayTranslation ? "secondary" : "ghost"}
              size="icon"
            >
              <Icon icon="hugeicons:translate" className="!size-5" />
            </Button>
          )}
        </TooltipTrigger>
        <TooltipContent>
          <p>{t("translation")}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
