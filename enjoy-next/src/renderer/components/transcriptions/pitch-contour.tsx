import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@renderer/components/ui";
import { useEffect } from "react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

export function PitchContour(props: {
  data: {
    frequency: number | null;
    time: number;
  }[];
}) {
  const { data } = props;

  useEffect(() => {
    console.log(data);
  }, []);

  return (
    <ChartContainer config={{ desktop: { label: "Pitch" } }}>
      <LineChart data={props.data}>
        <ChartTooltip />
        <ChartTooltipContent />
        <Line type="monotone" dataKey="frequency" />
        <CartesianGrid stroke="#ccc" />
        <XAxis dataKey="time" />
      </LineChart>
    </ChartContainer>
  );
}
