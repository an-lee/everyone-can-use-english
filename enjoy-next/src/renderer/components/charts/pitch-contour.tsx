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
import { useMemo, useRef, useState, useEffect } from "react";
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

export const PitchContourCanvas = ({ className }: { className?: string }) => {
  const { frequencies, activeRange, currentTime, waveform } =
    useMeidaPlayBackStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || frequencies.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set up canvas dimensions with device pixel ratio for sharper rendering
    const dpr = window.devicePixelRatio || 1;
    const width = (canvas.width = canvas.clientWidth * dpr);
    const height = (canvas.height = canvas.clientHeight * dpr);
    ctx.scale(dpr, dpr);

    // Max and min frequency for y-axis scaling
    const maxFreq = 400;
    const minFreq = 75;

    // Clear the canvas
    ctx.clearRect(0, 0, width / dpr, height / dpr);

    // Calculate time range to display
    const rangeStart = activeRange.start;
    const rangeEnd = activeRange.end;
    const rangeDuration = rangeEnd - rangeStart;

    // Draw background and grid
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    ctx.fillRect(0, 0, width / dpr, height / dpr);

    // Draw grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;

    // Horizontal grid lines (frequency)
    for (let freq = 100; freq <= 400; freq += 50) {
      const y =
        height / dpr -
        ((freq - minFreq) / (maxFreq - minFreq)) * (height / dpr);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width / dpr, y);
      ctx.stroke();
    }

    // Draw waveform as background if available
    if (waveform && waveform.peaks.length > 0) {
      // Calculate the portion of peaks that corresponds to the active range
      const duration = waveform.duration;
      const startSample = Math.floor(
        (rangeStart / duration) * waveform.peaks.length
      );
      const endSample = Math.ceil(
        (rangeEnd / duration) * waveform.peaks.length
      );

      // Draw the waveform
      ctx.beginPath();
      ctx.strokeStyle = "rgba(100, 100, 100, 0.4)";
      ctx.fillStyle = "rgba(100, 100, 100, 0.15)";
      ctx.lineWidth = 1;

      // Calculate the step size to avoid drawing too many samples
      const step = Math.max(
        1,
        Math.floor((endSample - startSample) / (width / dpr))
      );

      // Draw the waveform using a path
      ctx.beginPath();

      // Middle of the canvas
      const middleY = height / dpr / 2;

      // Start at the bottom middle of the canvas
      ctx.moveTo(0, middleY);

      // Draw the top half of the waveform
      for (let i = startSample; i < endSample; i += step) {
        if (i >= waveform.peaks.length) break;
        const x =
          ((i - startSample) / (endSample - startSample)) * (width / dpr);
        // Normalize the peak value to fit in half the canvas height
        // Peaks should already be normalized to -1.0 to 1.0
        const peakValue = waveform.peaks[i];
        const y = middleY - Math.abs(peakValue) * (middleY * 0.9);
        ctx.lineTo(x, y);
      }

      // Draw line to the end
      ctx.lineTo(width / dpr, middleY);

      // Draw the bottom half as a mirror of the top
      for (let i = endSample - 1; i >= startSample; i -= step) {
        if (i >= waveform.peaks.length) continue;
        const x =
          ((i - startSample) / (endSample - startSample)) * (width / dpr);
        const peakValue = waveform.peaks[i];
        const y = middleY + Math.abs(peakValue) * (middleY * 0.9);
        ctx.lineTo(x, y);
      }

      // Close the path
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Draw the frequency plot
    if (frequencies.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(220, 38, 38, 0.7)";
      ctx.lineWidth = 2;

      let lastX = -1;
      let lastY = -1;

      // Time per frequency value (seconds)
      const timeStep = 0.01; // Assume 10ms steps for frequencies

      // Plot frequencies relevant to our active range
      for (let i = 0; i < frequencies.length; i++) {
        const time = i * timeStep;

        // Skip if outside active range with a small buffer
        if (time < rangeStart - 0.1 || time > rangeEnd + 0.1) continue;

        // Normalize time to range [0, 1] within our active range
        const normalizedTime = (time - rangeStart) / rangeDuration;
        const x = normalizedTime * (width / dpr);

        const frequency = frequencies[i];
        if (frequency === null) {
          // Skip null values - path will be discontinued
          lastX = -1;
          lastY = -1;
          continue;
        }

        // Normalize frequency to range [0, 1] and calculate y position
        // Note: y is inverted in canvas (0 is top)
        const normalizedFreq = Math.max(
          0,
          Math.min(1, (frequency - minFreq) / (maxFreq - minFreq))
        );
        const y = height / dpr - normalizedFreq * (height / dpr);

        if (lastX === -1) {
          // Start a new path if previous point was missing
          ctx.moveTo(x, y);
        } else {
          // Connect to previous point
          ctx.lineTo(x, y);
        }

        lastX = x;
        lastY = y;
      }

      ctx.stroke();
    }

    // Draw current time marker
    if (currentTime >= rangeStart && currentTime <= rangeEnd) {
      const normalizedCurrentTime = (currentTime - rangeStart) / rangeDuration;
      const currentX = normalizedCurrentTime * (width / dpr);

      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(currentX, 0);
      ctx.lineTo(currentX, height / dpr);
      ctx.stroke();
    }
  }, [frequencies, activeRange, currentTime, waveform]);

  return (
    <canvas ref={canvasRef} className={cn("w-full h-20 rounded", className)} />
  );
};
