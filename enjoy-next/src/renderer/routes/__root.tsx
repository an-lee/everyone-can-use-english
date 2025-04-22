import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Toaster } from "@renderer/components/ui";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFontSize, useIpcError, useTheme } from "@renderer/hooks";
import { useAppStore, useSettingsStore } from "@renderer/store";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  useTheme();
  useFontSize();
  useIpcError();
  const { config } = useAppStore();
  const { refresh: refreshSettings } = useSettingsStore();

  useEffect(() => {
    if (!config.webApiUrl) return;
    refreshSettings();
  }, [config.webApiUrl]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />

      <Toaster richColors closeButton position="top-center" />
      <TanStackRouterDevtools position="top-right" />
    </QueryClientProvider>
  );
}
