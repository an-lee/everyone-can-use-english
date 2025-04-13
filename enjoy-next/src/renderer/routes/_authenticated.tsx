import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ScrollArea, SidebarInset } from "@renderer/components/ui";
import { AppSidebar } from "@renderer/components/layouts/sidebar";
import { SidebarProvider } from "@renderer/components/ui/sidebar";
import { AppMenubar } from "@renderer/components/layouts/menubar/app-menubar";

export const Route = createFileRoute("/_authenticated")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <SidebarProvider>
      <AppMenubar isAuthenticated={true} />
      <AppSidebar />
      <SidebarInset className="overflow-x-hidden overflow-y-hidden max-h-[calc(100svh-var(--menubar-height))]">
        <ScrollArea className="h-full">
          <Outlet />
        </ScrollArea>
      </SidebarInset>
    </SidebarProvider>
  );
}
