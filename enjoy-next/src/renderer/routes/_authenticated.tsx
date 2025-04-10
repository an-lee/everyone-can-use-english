import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { SidebarInset } from "@renderer/components/ui";
import { AppSidebar } from "@renderer/components/layouts/sidebar";
import { SidebarProvider } from "@renderer/components/ui/sidebar";
import { AppMenubar } from "@renderer/components/layouts/menubar/app-menubar";
import { useDbStore } from "@renderer/store";
import { DbStatusView } from "@renderer/components/status-views";

export const Route = createFileRoute("/_authenticated")({
  component: RouteComponent,
});

function RouteComponent() {
  const { dbState } = useDbStore();

  return (
    <SidebarProvider>
      <AppMenubar isAuthenticated={true} />
      <AppSidebar />
      <SidebarInset>
        {dbState.state === "connected" ? <Outlet /> : <DbStatusView />}
      </SidebarInset>
    </SidebarProvider>
  );
}
