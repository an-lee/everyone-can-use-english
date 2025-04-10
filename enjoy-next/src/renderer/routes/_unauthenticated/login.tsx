import {
  DbStatusView,
  AppInitializingView,
  LoginView,
} from "@renderer/components/status-views";
import { useAppStore, useDbStore } from "@renderer/store";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/_unauthenticated/login")({
  component: RouteComponent,
});

function RouteComponent() {
  const { appState } = useAppStore();
  const { dbState } = useDbStore();
  const router = useRouter();

  useEffect(() => {
    if (dbState.state === "connected") {
      router.navigate({ to: "/" });
    }
  }, [dbState.state]);

  if (appState.status === "login") {
    return <LoginView />;
  } else if (appState.status === "ready") {
    return <DbStatusView />;
  } else {
    return <AppInitializingView />;
  }
}
