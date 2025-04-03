import { useAppStore } from "@renderer/store";

export function LoadingIndicator() {
  const isLoading = useAppStore(
    (state: { isLoading: boolean }) => state.isLoading
  );

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/20 dark:bg-black/50 z-50">
      <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
    </div>
  );
}
