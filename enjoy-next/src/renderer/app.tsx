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
  LoginView,
  ConnectingDatabaseView,
  DatabaseErrorView,
} from "./components/status-views";
import { InitializingErrorView } from "./components/status-views/initializing-error-view";

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
  const { appState } = useAppStore();

  useTheme();
  useFontSize();

  // Handle different app states
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

    case "ready":
      // Check database state
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

    default:
      // This should never happen, but TypeScript wants us to handle it
      return (
        <InitializingErrorView
          error="Application reached an invalid state"
          message="Unknown application state"
        />
      );
  }
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
