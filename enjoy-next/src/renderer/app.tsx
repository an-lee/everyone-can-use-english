import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import "./lib/i18n";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import { useAppStore, useDbStore } from "./store";
import { useTheme } from "./hooks/use-theme";
import { useFontSize } from "./hooks/use-font-size";
import {
  InitializingView,
  ErrorView,
  LoginView,
  ConnectingDatabaseView,
  DatabaseErrorView,
} from "./components/status-views";

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const App = () => {
  const { dbState } = useDbStore();
  const { appStatus, initStatus } = useAppStore();

  useTheme();
  useFontSize();

  // App is still initializing
  if (appStatus === "initializing") {
    return <InitializingView initStatus={initStatus} />;
  }

  // Error during initialization
  if (appStatus === "error") {
    return <ErrorView initStatus={initStatus} />;
  }

  // Not logged in
  if (appStatus === "login") {
    return <LoginView />;
  }

  if (dbState.state === "connecting") {
    return <ConnectingDatabaseView />;
  }

  if (dbState.state === "error") {
    return (
      <DatabaseErrorView
        dbError={dbState.error}
        retryCount={dbState.retryCount}
        retryDelay={dbState.retryDelay}
      />
    );
  }

  // Everything is ready, show the app
  return <RouterProvider router={router} />;
};

// Render the app
const rootElement = document.getElementById("root");
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
