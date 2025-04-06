import { StrictMode, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import "./lib/i18n";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import { useAppStore, useAuthStore } from "./store";
import { Icon } from "@iconify/react";
import { AppMenubar } from "./components/layouts/menubar";
import { Login } from "./routes/login";
import { Toaster } from "./components/ui";
import { useTheme } from "./hooks/use-theme";
import { useFontSize } from "./hooks/use-font-size";
import { DbState } from "../preload/db-api";
import { InitStatus } from "../preload/app-initializer-api";

// Maximum retry attempts for database connection
const MAX_RETRIES = 5;

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Update DbState to include retry properties
interface EnhancedDbState extends DbState {
  retryCount?: number;
  retryDelay?: number;
}

type AppStatusType = "initializing" | "login" | "ready" | "error";

const App = () => {
  const { initialized } = useAppStore();
  const { isAuthenticated, autoLogin } = useAuthStore();
  const [appStatus, setAppStatus] = useState<AppStatusType>("initializing");
  const [initStatus, setInitStatus] = useState<InitStatus>({
    currentStep: "starting",
    progress: 0,
    error: null,
    message: "Starting application...",
  });
  const [dbState, setDbState] = useState<EnhancedDbState>({
    state: "disconnected",
    path: null,
    error: null,
    autoConnected: false,
  });

  useTheme();
  useFontSize();

  // Listen for app initialization status
  useEffect(() => {
    const handleInitStatus = (status: InitStatus) => {
      setInitStatus(status);

      if (status.error) {
        setAppStatus("error");
      } else if (status.currentStep === "ready") {
        // Call autoLogin when app is ready
        autoLogin().then(() => {
          if (isAuthenticated()) {
            setAppStatus("ready");
          } else {
            setAppStatus("login");
          }
        });
      }
    };

    // Get initial status
    if (window.EnjoyAPI) {
      window.EnjoyAPI.initializer.getStatus().then(handleInitStatus);
      window.EnjoyAPI.events.on("app-init-status", handleInitStatus);
    }

    return () => {
      if (window.EnjoyAPI) {
        window.EnjoyAPI.events.off("app-init-status", handleInitStatus);
      }
    };
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    if (initStatus.currentStep === "ready") {
      if (isAuthenticated()) {
        setAppStatus("ready");
      } else {
        setAppStatus("login");

        // When user logs out, ensure db state is checked
        if (window.EnjoyAPI && dbState.state === "connected") {
          window.EnjoyAPI.db.status().then((status) => {
            setDbState(status);
            console.log("DB status after logout:", status);
          });
        }
      }
    }
  }, [isAuthenticated(), initStatus.currentStep]);

  // Listen for database state changes
  useEffect(() => {
    const handleDbStateChange = (state: EnhancedDbState) => {
      console.log("Database state changed:", state);
      setDbState(state);
    };

    // Check database status immediately when authenticated and app is ready
    const checkDbStatus = async () => {
      if (!isAuthenticated() || !window.EnjoyAPI) return;

      try {
        console.log("Checking database status");
        const status = await window.EnjoyAPI.db.status();
        console.log("Database status:", status);
        setDbState(status);

        // If user is authenticated but db isn't connected, try to connect
        if (status.state !== "connected" && status.state !== "connecting") {
          console.log("Connecting to database");
          try {
            await window.EnjoyAPI.db.connect();
          } catch (connectErr) {
            console.error("Failed to connect to database:", connectErr);
            // Get the latest status after connection attempt (even if it failed)
            const latestStatus = await window.EnjoyAPI.db.status();
            setDbState(latestStatus);
          }
        }
      } catch (err) {
        console.error("Failed to check database status:", err);
      }
    };

    // Check initial status when auth state changes
    if (appStatus === "ready") {
      console.log("App is ready, checking database status");
      checkDbStatus();
    }

    // Set up event listener for database state changes
    if (window.EnjoyAPI) {
      window.EnjoyAPI.events.on("db-state-changed", handleDbStateChange);
    }

    // Clean up event listener
    return () => {
      if (window.EnjoyAPI) {
        window.EnjoyAPI.events.off("db-state-changed", handleDbStateChange);
      }
    };
  }, [isAuthenticated(), appStatus]);

  // App is still initializing
  if (appStatus === "initializing") {
    return (
      <div className="flex h-[100svh] w-screen flex-col items-center justify-center gap-4">
        <Icon
          icon="mdi:loading"
          className="h-12 w-12 animate-spin text-primary"
        />
        <div className="text-center">
          <p className="text-lg font-medium">{initStatus.message}</p>
          <div className="mt-2 h-2 w-64 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${initStatus.progress}%` }}
            />
          </div>
        </div>
        <Toaster richColors closeButton position="top-center" />
      </div>
    );
  }

  // Error during initialization
  if (appStatus === "error") {
    return (
      <div className="flex h-[100svh] w-screen flex-col items-center justify-center gap-4">
        <Icon icon="mdi:alert-circle" className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <p className="text-lg font-medium">Error initializing application</p>
          {initStatus.error && (
            <p className="mt-1 text-sm text-muted-foreground">
              {initStatus.error}
            </p>
          )}
          <button
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
        <Toaster richColors closeButton position="top-center" />
      </div>
    );
  }

  // Not logged in
  if (appStatus === "login") {
    return (
      <div className="flex h-[100svh] w-screen items-center justify-center pt-[var(--menubar-height)]">
        <AppMenubar isAuthenticated={false} />
        <Login />
        <Toaster richColors closeButton position="top-center" />
      </div>
    );
  }

  // Database is connecting
  const dbLoading = dbState.state === "connecting";
  // Database error
  const dbError = dbState.state === "error";

  if (dbLoading) {
    return (
      <div className="flex h-[100svh] w-screen items-center justify-center pt-[var(--menubar-height)]">
        <AppMenubar isAuthenticated={false} />
        <div className="flex flex-col items-center gap-4">
          <Icon icon="mdi:database" className="h-10 w-10" />
          <div className="text-center">
            <p className="text-lg font-medium">Connecting to database...</p>
            <p className="text-sm text-muted-foreground">Please wait</p>
          </div>
          <Icon icon="mdi:loading" className="h-6 w-6 animate-spin" />
        </div>
        <Toaster richColors closeButton position="top-center" />
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="flex h-[100svh] w-screen items-center justify-center pt-[var(--menubar-height)]">
        <AppMenubar isAuthenticated={false} />
        <div className="flex flex-col items-center gap-4">
          <Icon
            icon="mdi:database-alert"
            className="h-10 w-10 text-destructive"
          />
          <div className="text-center">
            <p className="text-lg font-medium">Database Error</p>
            <p className="text-sm text-muted-foreground">{dbState.error}</p>

            {dbState.retryCount && dbState.retryDelay ? (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground">
                  Retry attempt {dbState.retryCount} of {MAX_RETRIES}
                </p>
                <div className="mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-amber-500 transition-all duration-500"
                    style={{
                      width: `${(dbState.retryCount / MAX_RETRIES) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <button
                className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
                onClick={async () => {
                  if (window.EnjoyAPI) {
                    await window.EnjoyAPI.db.connect();
                  }
                }}
              >
                Retry Connection
              </button>
            )}
          </div>
        </div>
        <Toaster richColors closeButton position="top-center" />
      </div>
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
      <Toaster richColors closeButton position="top-center" />
    </StrictMode>
  );
}
