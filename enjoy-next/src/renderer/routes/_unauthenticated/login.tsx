import {
  InitializingErrorView,
  InitializingView,
  LoadingView,
  LoginView,
} from "@renderer/components/status-views";
import { useAppStore } from "@renderer/store";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/_unauthenticated/login")({
  component: RouteComponent,
});

function RouteComponent() {
  const { appState } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (appState.status === "ready") {
      router.navigate({ to: "/" });
    }
  }, [appState.status]);

  switch (appState.status) {
    case "initializing":
      return <InitializingView progress={appState.progress} />;
    case "initialization_error":
      return (
        <InitializingErrorView
          error={appState.error}
          message={appState.progress.message}
        />
      );
    case "login":
      return <LoginView />;
    default:
      return <LoadingView />;
  }
}
