import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@renderer/components/ui";
import { AppSidebar } from "@renderer/components/app-sidebar";

export const Route = createRootRoute({
  component: () => (
    <div>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SidebarTrigger className="-ml-1" />
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <Link to="/" className="[&.active]:font-bold">
              Home
            </Link>{" "}
            <Link to="/about" className="[&.active]:font-bold">
              About
            </Link>
          </header>
          <Outlet />
        </SidebarInset>
      </SidebarProvider>
      <TanStackRouterDevtools />
    </div>
  ),
});
