import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import "@renderer/lib/i18n";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import { useAuthStore } from "./store";

// Create a new router instance
const router = createRouter({ routeTree, context: { isAuthenticated: false } });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <RouterProvider
      router={router}
      context={{ isAuthenticated: isAuthenticated() }}
    />
  );
}

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
