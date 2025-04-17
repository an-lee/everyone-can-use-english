import { useMediaFrequencies } from "@/renderer/hooks";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@renderer/components/ui";
import { useMemo, useRef, useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Label,
  Area,
  ComposedChart,
  ReferenceArea,
} from "recharts";
import { EmptyView, ErrorView } from "../status-views";
import { LoadingView } from "../status-views";
import { secondsToTimestamp } from "@renderer/lib/utils";
import { useMediaPlayer } from "@/renderer/store";
import { cn } from "@renderer/lib/utils";

// Custom tooltip component for displaying the frequency with a timestamp
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md bg-background/95 p-3 shadow-md border border-border text-sm backdrop-blur-sm">
        <p className="font-mono text-xs mb-1">{`${secondsToTimestamp(label)}`}</p>
        <p className="text-chart-3 font-medium">{`${Math.round(payload[0].value || 0)} Hz`}</p>
      </div>
    );
  }
  return null;
};

export function PitchContour(props: {
  src: string;
  startTime?: number;
  endTime?: number;
  timeline?: TimelineEntry[];
}) {
  const { src, startTime = 0, timeline = [] } = props;
  let { endTime } = props;
  const { data, isLoading, error } = useMediaFrequencies(src);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const { currentTime } = useMediaPlayer();

  // Monitor container width for responsive sizing
  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    // Initial measurement
    updateWidth();

    // Listen for resize
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(containerRef.current);

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);

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

    // Apply some smoothing to the frequency data to make it look nicer
    const smoothingFactor = 3; // Adjust this to control the amount of smoothing
    const frequencies = data.frequencies.slice(startIndex, endIndex);
    const smoothedFrequencies = frequencies.map((frequency, index) => {
      if (frequency === null || isNaN(frequency as number)) return null;

      let sum = 0;
      let count = 0;

      for (
        let i = Math.max(0, index - smoothingFactor);
        i <= Math.min(frequencies.length - 1, index + smoothingFactor);
        i++
      ) {
        if (frequencies[i] !== null && !isNaN(frequencies[i] as number)) {
          sum += frequencies[i] as number;
          count++;
        }
      }

      return count > 0 ? sum / count : null;
    });

    return smoothedFrequencies.map((frequency, index) => ({
      frequency,
      time: startTime + (index / (endIndex - startIndex)) * duration,
    }));
  }, [data, startTime, endTime]);

  // Calculate domain for Y axis
  const yDomain = useMemo(() => {
    if (!chartData.length) return [0, 300];

    const frequencies = chartData
      .map((d) => d.frequency)
      .filter((f) => f !== null && !isNaN(f)) as number[];

    if (!frequencies.length) return [0, 300];

    // Most human speech frequencies are in the 85-255 Hz range
    // Let's make sure we're showing a reasonable range
    const minFreq = Math.min(...frequencies);
    const maxFreq = Math.max(...frequencies);

    // Set a reasonable min/max that focuses on the actual data
    const min = Math.max(0, Math.min(100, Math.floor(minFreq / 10) * 10));
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

    // Calculate nice rounded min and max values
    const niceMin = Math.floor(min / step) * step;
    const niceMax = Math.ceil(max / step) * step;

    // Generate ticks
    const ticks = [];
    for (let i = niceMin; i <= niceMax; i += step) {
      // Only add if within our domain
      if (i >= min && i <= max) {
        ticks.push(i);
      }
    }

    // Ensure we have at least min and max values
    if (!ticks.includes(min)) ticks.unshift(min);
    if (!ticks.includes(max)) ticks.push(max);

    // Limit to 5 ticks maximum
    if (ticks.length > 5) {
      const stride = Math.ceil(ticks.length / 5);
      return ticks.filter((_, i) => i % stride === 0);
    }

    return ticks;
  }, [yDomain]);

  // Calculate X-axis ticks based on duration - one tick per second
  const xAxisTicks = useMemo(() => {
    if (!data) return [];

    endTime = endTime || data.metadata.duration;
    const duration = endTime - startTime;

    // Create tick marks at 1 second intervals
    const ticks = [];
    // Round startTime up to the next whole second
    const firstTick = Math.ceil(startTime);
    // Round endTime down to the previous whole second
    const lastTick = Math.floor(endTime);

    for (let i = firstTick; i <= lastTick; i += 1) {
      ticks.push(i);
    }

    // Always include start and end if they're not already included
    if (!ticks.includes(startTime) && startTime < firstTick) {
      ticks.unshift(startTime);
    }
    if (!ticks.includes(endTime) && endTime > lastTick) {
      ticks.push(endTime);
    }

    return ticks;
  }, [data, startTime, endTime]);

  if (isLoading) return <LoadingView />;
  if (error) return <ErrorView error={error.message} />;
  if (!data) return <EmptyView />;

  // Format y-axis tick values to be readable
  const formatYAxis = (value: number) => {
    // For values over 1000, use "k" suffix (e.g., 1.2k)
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }

    // Otherwise just return the integer value
    return Math.round(value).toString();
  };

  // Always show cursor, regardless of range check
  const showCursor = currentTime !== undefined && currentTime !== null;

  const CHART_HEIGHT = 110;

  // Calculate cursor position as percentage
  const cursorPosition = useMemo(() => {
    if (
      !showCursor ||
      !data ||
      currentTime < startTime ||
      currentTime > (endTime || data.metadata.duration)
    ) {
      return null;
    }

    const duration = (endTime || data.metadata.duration) - startTime;
    return ((currentTime - startTime) / duration) * 100;
  }, [currentTime, startTime, endTime, data, showCursor]);

  return (
    <div className="w-full" style={{ height: CHART_HEIGHT }}>
      <ChartContainer
        config={{
          pitch: {
            label: "Pitch",
            color: "hsl(var(--chart-3))",
          },
        }}
        className={cn("!h-[110px] !aspect-auto")}
      >
        <div className="relative w-full h-full" ref={containerRef}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 15, left: 15, bottom: 0 }}
            >
              <defs>
                <linearGradient id="pitchGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--chart-3))"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--chart-3))"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.5}
              />

              <XAxis
                dataKey="time"
                tickFormatter={(value) => secondsToTimestamp(value)}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 9 }}
                padding={{ left: 10, right: 10 }}
                ticks={xAxisTicks}
                height={20}
              />

              <YAxis
                domain={yDomain}
                label={{
                  value: "Hz",
                  angle: -90,
                  position: "insideLeft",
                  offset: 0,
                  style: { fill: "hsl(var(--muted-foreground))", fontSize: 9 },
                }}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 9 }}
                tickFormatter={formatYAxis}
                width={35}
                ticks={yAxisTicks}
              />

              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="frequency"
                stroke="hsl(var(--chart-3))"
                fillOpacity={1}
                fill="url(#pitchGradient)"
                connectNulls
              />

              <Line
                type="monotone"
                dataKey="frequency"
                stroke="hsl(var(--chart-3))"
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 5,
                  stroke: "hsl(var(--background))",
                  strokeWidth: 2,
                  fill: "hsl(var(--chart-3))",
                }}
                connectNulls
                animationDuration={500}
                isAnimationActive={true}
              />
            </ComposedChart>
          </ResponsiveContainer>

          {/* Cursor overlay - completely separate from Recharts */}
          {cursorPosition !== null && (
            <div
              className="absolute top-0 bottom-0 z-50 pointer-events-none"
              style={{
                left: `${cursorPosition}%`,
                width: "1px",
                backgroundColor: "hsl(var(--chart-5))",
                boxShadow: "0 0 1px rgba(0,0,0,0.2)",
                opacity: 0.8,
                transform: "translateX(-50%)",
              }}
            />
          )}
        </div>
      </ChartContainer>
    </div>
  );
}
