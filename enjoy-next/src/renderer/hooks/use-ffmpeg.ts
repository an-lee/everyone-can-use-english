import { useQuery } from "@tanstack/react-query";

/**
 * Get the waveform data for an media file
 * @param src - The source of the media file
 * @returns The waveform data for the media file
 */
export const useWaveform = (
  src: string,
  options?: AudioProcessOptions & {
    enabled?: boolean;
  }
) => {
  const { enabled = true } = options ?? {};
  delete options?.enabled;

  return useQuery<{
    peaks: Float32Array;
    sampleRate: number;
    duration: number;
  } | null>({
    queryKey: ["waveform", src, options],
    queryFn: async () => {
      if (!src || !window.EnjoyAPI) {
        return null;
      }
      console.debug("Getting waveform for", src, options);
      return await window.EnjoyAPI.plugin.executeCommand(
        "ffmpeg-plugin",
        "getWaveform",
        [src, options]
      );
    },
    enabled: enabled && !!src,
    staleTime: Infinity,
  });
};
