import { useQuery } from "@tanstack/react-query";

/**
 * Get the frequency data for an media file
 * @param src - The source of the media file
 * @returns The frequency data for the media file
 */
export const useMediaFrequencies = (
  src: string,
  options?: {
    sampleRate?: number;
    sensitivity?: number;
    filterType?: "basic" | "language" | "tonal";
    timeoutMs?: number;
  }
) => {
  return useQuery<{
    frequencies: (number | null)[];
    metadata: { duration: number; timeStep: number };
  } | null>({
    queryKey: ["frequency-data", src],
    queryFn: async () => {
      if (!src || !window.EnjoyAPI) {
        return null;
      }
      return await window.EnjoyAPI.plugin.executeCommand(
        "ffmpeg-plugin",
        "getFrequencyData",
        [src, options]
      );
    },
    enabled: !!src,
    staleTime: Infinity,
  });
};
