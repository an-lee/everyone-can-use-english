import { StrictMode, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import "./lib/i18n";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import { useAppStore, useAuthStore } from "./store";
import { Icon } from "@iconify/react";
import { AppMenubar } from "./components/layout/menubar";
import { Login } from "./routes/login";

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const App = () => {
  const { fetchConfig, initialized } = useAppStore();
  const { isAuthenticated, autoLogin } = useAuthStore();

  useEffect(() => {
    fetchConfig();
    autoLogin();
  }, []);

  if (!initialized) {
    return (
      <div className="flex h-[100svh] w-screen items-center justify-center pt-[var(--menubar-height)]">
        <AppMenubar isAuthenticated={false} />
        <Icon icon="mdi:loading" className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated()) {
    return (
      <div className="flex h-[100svh] w-screen items-center justify-center pt-[var(--menubar-height)]">
        <AppMenubar isAuthenticated={false} />
        <Login />
      </div>
    );
  }

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
