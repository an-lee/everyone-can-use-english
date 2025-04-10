import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppMenubar } from "@renderer/components/layouts/menubar";

export const Route = createFileRoute("/_unauthenticated")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex h-[100svh] w-screen flex-col items-center justify-center gap-4 pt-[var(--menubar-height)]">
      <AppMenubar isAuthenticated={false} />
      <Outlet />
    </div>
  );
}
