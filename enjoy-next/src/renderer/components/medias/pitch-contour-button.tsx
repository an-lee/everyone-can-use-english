import { Icon } from "@iconify/react";
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@renderer/components/ui";
import { useTranslation } from "react-i18next";
import { useMediaPlayerSetting, useMediaPlayBack } from "@renderer/store";

export function PitchContourButton(props: {
  asChild?: boolean;
  children?: React.ReactNode;
}) {
  const { asChild, children } = props;
  const { t } = useTranslation("components/medias");
  const { displayPitchContour, setDisplayPitchContour } =
    useMediaPlayerSetting();
  const { interactable } = useMediaPlayBack();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          onClick={() => setDisplayPitchContour(!displayPitchContour)}
          asChild
        >
          {asChild ? (
            children
          ) : (
            <Button
              variant={displayPitchContour ? "secondary" : "ghost"}
              size="icon"
              disabled={!interactable}
            >
              <Icon icon="hugeicons:chart-average" />
            </Button>
          )}
        </TooltipTrigger>
        <TooltipContent>
          <p>{t("pitchContour")}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
