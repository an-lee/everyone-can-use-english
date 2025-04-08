import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { SidebarInset, SidebarProvider } from "@renderer/components/ui";
import { AppSidebar } from "@/renderer/components/layouts/sidebar";
import { AppMenubar } from "@/renderer/components/layouts/menubar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});

export const Route = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <AppMenubar />
        <AppSidebar />
        <SidebarInset>
          <Outlet />
        </SidebarInset>
      </SidebarProvider>

      <TanStackRouterDevtools position="bottom-right" />
    </QueryClientProvider>
  ),
});
