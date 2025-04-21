import {
  Button,
  Card,
  CardContent,
  CardHeader,
  ChartContainer,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@renderer/components/ui";
import { useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
  ReferenceLine,
} from "recharts";
import { secondsToTimestamp } from "@renderer/lib/utils";
import { useMeidaPlayBackStore, usePlayerSettingStore } from "@renderer/store";
import { cn } from "@renderer/lib/utils";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";

export function PitchContourChart() {
  const { frequencies, activeRange, duration } = useMeidaPlayBackStore();
  const startTime = activeRange.start;
  const endTime = activeRange.end || duration;
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const { currentTime } = useMeidaPlayBackStore();

  const chartData = useMemo(() => {
    if (!frequencies.length) return [];

    const duration = endTime - startTime;

    const startIndex = Math.floor(
      (startTime / (duration || 1)) * frequencies.length
    );
    const endIndex = Math.floor(
      (endTime / (duration || 1)) * frequencies.length
    );

    // Apply some smoothing to the frequency data to make it look nicer
    const smoothingFactor = 3; // Adjust this to control the amount of smoothing
    const frequencySlice = frequencies.slice(startIndex, endIndex);
    const smoothedFrequencies = frequencySlice.map((frequency, index) => {
      if (frequency === null || isNaN(frequency as number)) return null;

      let sum = 0;
      let count = 0;

      for (
        let i = Math.max(0, index - smoothingFactor);
        i <= Math.min(frequencySlice.length - 1, index + smoothingFactor);
        i++
      ) {
        if (frequencySlice[i] !== null && !isNaN(frequencySlice[i] as number)) {
          sum += frequencySlice[i] as number;
          count++;
        }
      }

      return count > 0 ? sum / count : null;
    });

    return smoothedFrequencies.map((frequency, index) => ({
      frequency,
      time: startTime + (index / (endIndex - startIndex)) * duration,
    }));
  }, [frequencies, startTime, endTime, duration]);

  // Calculate domain for Y axis
  const yDomain = useMemo(() => {
    if (!chartData.length) return [0, 300];

    const frequencies = chartData
      .map((d) => d.frequency)
      .filter((f) => f !== null && !isNaN(f)) as number[];

    if (!frequencies.length) return [0, 300];

    // Most human speech frequencies are in the 85-255 Hz range
    // Let's make sure we're showing a reasonable range
    const maxFreq = Math.max(...frequencies);

    // Set a reasonable max that focuses on the actual data
    // Always start from 0
    const min = 0;
    const max = Math.min(500, Math.ceil(maxFreq / 10) * 10);

    return [min, max];
  }, [chartData]);

  // Calculate optimal tick values for Y axis
  const yAxisTicks = useMemo(() => {
    const [min, max] = yDomain;

    // Calculate a nice step size that produces round numbers
    // Aim for 4-5 ticks total
    const range = max - min;
    let step = Math.pow(10, Math.floor(Math.log10(range)) - 1);

    // Adjust step size based on range
    if (range / step > 10) {
      step *= 5;
    } else if (range / step > 5) {
      step *= 2;
    }

    // Generate ticks
    const ticks = [];
    for (
      let i = Math.floor(min / step) * step;
      i <= Math.ceil(max / step) * step;
      i += step
    ) {
      // Only add if within our domain
      if (i >= min && i <= max) {
        ticks.push(i);
      }
    }

    // Limit to 5 ticks maximum
    if (ticks.length > 5) {
      const stride = Math.ceil(ticks.length / 5);
      return ticks.filter((_, i) => i % stride === 0);
    }

    return ticks;
  }, [yDomain]);

  // Check if cursor should be visible
  const shouldShowCursor = currentTime !== undefined && currentTime !== null;

  // Get a bounded current time for positioning the cursor
  const boundedCurrentTime = useMemo(() => {
    if (!shouldShowCursor) return null;
    const bounded = Math.max(startTime, Math.min(endTime, currentTime));
    return bounded;
  }, [currentTime, startTime, endTime, shouldShowCursor]);

  // Find the nearest data point index to the current time for the cursor
  const cursorDataPoint = useMemo(() => {
    if (boundedCurrentTime === null || !chartData.length) return null;

    // Find the data point closest to current time
    const index = chartData.findIndex(
      (point) => point.time >= boundedCurrentTime
    );
    if (index === -1) return chartData.length - 1;

    // If we found a point after the current time, check if there's a closer point before
    if (index > 0) {
      const beforeDiff = Math.abs(
        chartData[index - 1].time - boundedCurrentTime
      );
      const afterDiff = Math.abs(chartData[index].time - boundedCurrentTime);
      return beforeDiff < afterDiff ? index - 1 : index;
    }

    return index;
  }, [boundedCurrentTime, chartData]);

  // Format y-axis tick values to be readable
  const formatYAxis = (value: number) => {
    return Math.round(value).toString();
  };

  const CHART_HEIGHT = 110;
  const chartMargin = { top: 0, right: 0, left: 15, bottom: 0 };

  // Get exact time value for cursor positioning with ReCharts
  const cursorXValue =
    cursorDataPoint !== null ? chartData[cursorDataPoint].time : null;

  return (
    <div className="w-full" style={{ height: CHART_HEIGHT + 15 }}>
      <ChartContainer
        config={{
          pitch: {
            label: "Pitch",
            color: "var(--chart-3)",
          },
        }}
        className={cn("!h-[125px] !aspect-auto overflow-hidden")}
      >
        <div className="relative w-full h-full" ref={containerRef}>
          <div className="w-full h-full" ref={chartRef}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={chartMargin}>
                <defs>
                  <linearGradient
                    id="pitchGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--chart-3)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--chart-3)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  opacity={0.5}
                  horizontal={true}
                  vertical={false}
                />

                <XAxis
                  dataKey="time"
                  tickFormatter={(value) =>
                    secondsToTimestamp(value, { includeMs: true })
                  }
                  stroke="var(--muted-foreground)"
                  tick={{ fontSize: 9 }}
                  padding={{ left: 10, right: 10 }}
                  height={30}
                  axisLine={{
                    stroke: "var(--muted-foreground)",
                    strokeWidth: 1,
                  }}
                  tickLine={{
                    stroke: "var(--muted-foreground)",
                    strokeWidth: 1,
                  }}
                  scale="linear"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  tickCount={5}
                />

                <YAxis
                  domain={[0, yDomain[1]]}
                  label={{
                    value: "Hz",
                    angle: -90,
                    position: "insideLeft",
                    offset: 0,
                    style: {
                      fill: "var(--muted-foreground)",
                      fontSize: 9,
                    },
                  }}
                  stroke="var(--muted-foreground)"
                  tick={{ fontSize: 9 }}
                  tickFormatter={formatYAxis}
                  width={35}
                  ticks={yAxisTicks}
                  axisLine={{
                    stroke: "var(--muted-foreground)",
                    strokeWidth: 0.5,
                  }}
                  tickLine={{ stroke: "var(--muted-foreground)" }}
                  allowDecimals={false}
                />

                <Tooltip content={<CustomTooltip />} />

                <Area
                  type="monotone"
                  dataKey="frequency"
                  stroke="var(--chart-3)"
                  fillOpacity={1}
                  fill="url(#pitchGradient)"
                  connectNulls
                />

                <Line
                  type="monotone"
                  dataKey="frequency"
                  stroke="var(--chart-3)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 5,
                    stroke: "var(--background)",
                    strokeWidth: 2,
                    fill: "var(--chart-3)",
                  }}
                  connectNulls
                  animationDuration={500}
                  isAnimationActive={true}
                />

                {/* Cursor implementation using exact data point time */}
                {cursorXValue !== null && (
                  <ReferenceLine
                    x={cursorXValue}
                    stroke="var(--chart-5)"
                    strokeWidth={1}
                    strokeOpacity={1}
                    isFront={true}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </ChartContainer>
    </div>
  );
}

export function PitchContour() {
  const { t } = useTranslation("components/charts");
  const {
    frequencyAlgorithm,
    setFrequencyAlgorithm,
    frequencyFilterType,
    setFrequencyFilterType,
  } = usePlayerSettingStore();

  return (
    <Card>
      <CardHeader className="py-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 font-medium">{t("pitchContour")}</div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Icon icon="tabler:dots-vertical" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  {t("algorithm")}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onClick={() => setFrequencyAlgorithm("YIN")}
                  >
                    YIN
                    {frequencyAlgorithm === "YIN" && (
                      <Icon icon="tabler:check" />
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFrequencyAlgorithm("AMDF")}
                  >
                    AMDF
                    {frequencyAlgorithm === "AMDF" && (
                      <Icon icon="tabler:check" />
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFrequencyAlgorithm("ACF2PLUS")}
                  >
                    ACF2PLUS
                    {frequencyAlgorithm === "ACF2PLUS" && (
                      <Icon icon="tabler:check" />
                    )}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  {t("filterType")}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onClick={() => setFrequencyFilterType("basic")}
                  >
                    {t("basic")}
                    {frequencyFilterType === "basic" && (
                      <Icon icon="tabler:check" />
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFrequencyFilterType("language")}
                  >
                    {t("language")}
                    {frequencyFilterType === "language" && (
                      <Icon icon="tabler:check" />
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFrequencyFilterType("tonal")}
                  >
                    {t("tonal")}
                    {frequencyFilterType === "tonal" && (
                      <Icon icon="tabler:check" />
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFrequencyFilterType("speech")}
                  >
                    {t("speech")}
                    {frequencyFilterType === "speech" && (
                      <Icon icon="tabler:check" />
                    )}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <PitchContourChart />
        <p className="text-xs italic text-muted-foreground">
          * {t("pitchContorExplanation")}
        </p>
      </CardContent>
    </Card>
  );
}
// Custom tooltip component for displaying the frequency with a timestamp
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md bg-background/95 p-3 shadow-md border border-border text-sm backdrop-blur-sm">
        <p className="font-mono text-xs mb-1">{`${secondsToTimestamp(label, {
          includeMs: true,
        })}`}</p>
        <p
          className="font-medium"
          style={{ color: "var(--chart-3)" }}
        >{`${Math.round(payload[0].value || 0)} Hz`}</p>
      </div>
    );
  }
  return null;
};
