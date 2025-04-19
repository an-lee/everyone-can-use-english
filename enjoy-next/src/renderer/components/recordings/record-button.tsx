import { useRecorderStore } from "@renderer/store";
import { Button } from "@renderer/components/ui";
import { toast } from "sonner";
import { useEffect } from "react";
import { Icon } from "@iconify/react";

export const RecordButton = (props: {
  histogramContainer?: React.RefObject<HTMLDivElement | null>;
}) => {
  const {
    initRecorder,
    status,
    startRecording,
    stopRecording,
    accessable,
    error,
    requestPermission,
    blob,
    clearBlob,
    setupHistogramContainer,
  } = useRecorderStore();

  useEffect(() => {
    initRecorder();
    if (props.histogramContainer?.current) {
      setupHistogramContainer(props.histogramContainer.current);
    }
  }, [props.histogramContainer?.current]);

  useEffect(() => {
    if (status === "idle" && !accessable) {
      requestPermission();
    }
  }, [status, error]);

  useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);

  useEffect(() => {
    if (blob) {
      console.log(blob);
    }
  }, [blob]);

  useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);

  return (
    <Button
      disabled={!accessable}
      variant="destructive"
      className="rounded-full aspect-square size-10 shadow-sm"
      onClick={() => {
        if (status === "recording") {
          stopRecording();
        } else {
          startRecording();
        }
      }}
      size="default"
    >
      {status === "initializing" && (
        <Icon
          icon="tabler:loader"
          className="!size-6 animate-spin text-primary-foreground"
        />
      )}
      {status === "idle" && (
        <Icon
          icon="tabler:microphone-filled"
          className="!size-5 text-primary-foreground"
        />
      )}
      {status === "recording" && (
        <Icon
          icon="tabler:player-stop-filled"
          className="!size-5 text-primary-foreground"
        />
      )}
    </Button>
  );
};
