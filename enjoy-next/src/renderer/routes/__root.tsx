import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { SidebarInset, SidebarProvider } from "@renderer/components/ui";
import { AppSidebar } from "@renderer/components/layout/sidebar";
import { AppMenubar } from "@renderer/components/layout/menubar";
import { useAppStore } from "@renderer/store";
import { Login } from "@renderer/components/login";

const isAuthenticated = useAppStore.getState().currentUser !== null;

export const Route = createRootRoute({
  component: () => (
    <>
      <SidebarProvider>
        <AppMenubar />
        {isAuthenticated ? (
          <>
            <AppSidebar />
            <SidebarInset>
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
          </>
        ) : (
          <div className="w-full min-h-[calc(100svh-var(--menubar-height))]">
            <Login />
          </div>
        )}
      </SidebarProvider>

      <TanStackRouterDevtools position="bottom-right" />
    </>
  ),
});
