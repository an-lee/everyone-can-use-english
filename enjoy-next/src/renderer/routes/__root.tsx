import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { SidebarInset, SidebarProvider } from "@renderer/components/ui";
import { AppSidebar } from "@renderer/components/layout/sidebar";
import { AppMenubar } from "@renderer/components/layout/menubar";
import { useAppStore } from "@renderer/store";
import { Login } from "@renderer/routes/login";

const isAuthenticated = useAppStore.getState().isAuthenticated();

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
          <div className="w-full flex h-[calc(100svh-var(--menubar-height))] flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10 overflow-auto">
            <div className="flex w-full max-w-sm flex-col gap-6">
              <Login />
            </div>
          </div>
        )}
      </SidebarProvider>

      <TanStackRouterDevtools position="bottom-right" />
    </>
  ),
});
