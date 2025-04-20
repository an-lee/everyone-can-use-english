import { useRecorderStore } from "@renderer/store";
import { Button } from "@renderer/components/ui";
import { toast } from "sonner";
import { useEffect } from "react";
import { Icon } from "@iconify/react";
import { useCreateRecording } from "@/renderer/hooks/use-recording";

export const RecordButton = (props: {
  histogramContainer?: React.RefObject<HTMLDivElement | null>;
  targetId?: string;
  targetType?: "Audio" | "Video" | "ChatMessage" | "None";
  referenceId?: number;
}) => {
  const { histogramContainer, targetId, targetType, referenceId } = props;

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

  const {
    mutate: createRecording,
    isSuccess: isCreated,
    data,
  } = useCreateRecording();

  const handleCreateRecording = async () => {
    if (!blob) return;
    const arrayBuffer = await blob.arrayBuffer();
    createRecording({
      targetId,
      targetType,
      referenceId,
      blob: {
        type: blob.type,
        arrayBuffer,
      },
    });
    clearBlob();
  };

  useEffect(() => {
    initRecorder();
    if (histogramContainer?.current) {
      setupHistogramContainer(histogramContainer.current);
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
    if (isCreated && data) {
      toast.success("Recording created successfully");
      console.log("data", data);
    }
  }, [isCreated, data]);

  useEffect(() => {
    if (blob) {
      handleCreateRecording();
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
