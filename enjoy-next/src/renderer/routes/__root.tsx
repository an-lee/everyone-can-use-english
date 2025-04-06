import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { SidebarInset, SidebarProvider } from "@renderer/components/ui";
import { AppSidebar } from "@/renderer/components/layouts/sidebar";
import { AppMenubar } from "@/renderer/components/layouts/menubar";

export const Route = createRootRoute({
  component: () => (
    <>
      <SidebarProvider>
        <AppMenubar />
        <AppSidebar />
        <SidebarInset>
          <Outlet />
        </SidebarInset>
      </SidebarProvider>

      <TanStackRouterDevtools position="bottom-right" />
    </>
  ),
});
