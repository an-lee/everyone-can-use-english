import { useMediaFrequencies } from "@/renderer/hooks";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@renderer/components/ui";
import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { EmptyView, ErrorView } from "../status-views";
import { LoadingView } from "../status-views";

export function PitchContour(props: {
  src: string;
  startTime?: number;
  endTime?: number;
  timeline?: TimelineEntry[];
}) {
  const { src, startTime = 0, timeline } = props;
  let { endTime } = props;
  const { data, isLoading, error } = useMediaFrequencies(src);

  const chartData = useMemo(() => {
    if (!data) return [];

    endTime = endTime || data.metadata.duration;
    const duration = endTime - startTime;

    const startIndex = Math.floor(
      (startTime / data.metadata.duration) * data.frequencies.length
    );
    const endIndex = Math.floor(
      (endTime / data.metadata.duration) * data.frequencies.length
    );

    return data.frequencies
      .slice(startIndex, endIndex)
      .map((frequency, index) => ({
        frequency,
        time: (index / data.frequencies.length) * duration,
      }));
  }, [data, startTime, endTime]);

  if (isLoading) return <LoadingView />;
  if (error) return <ErrorView error={error.message} />;
  if (!data) return <EmptyView />;

  return (
    <ChartContainer config={{ desktop: { label: "Pitch" } }}>
      <LineChart data={chartData}>
        <ChartTooltip />
        <ChartTooltipContent />
        <Line type="monotone" dataKey="frequency" />
        <CartesianGrid stroke="#ccc" />
        <XAxis dataKey="time" />
      </LineChart>
    </ChartContainer>
  );
}
