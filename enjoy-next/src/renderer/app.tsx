import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import {
  createRouter,
  RouterProvider,
  createHashHistory,
} from "@tanstack/react-router";
import "@renderer/lib/i18n";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import { useAuthStore, useDbStore } from "./store";

// Create a new router instance
const history = createHashHistory();
const router = createRouter({
  routeTree,
  context: { isAuthenticated: false },
  history,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function App() {
  const { isAuthenticated } = useAuthStore();
  const { dbState } = useDbStore();

  return (
    <RouterProvider
      router={router}
      context={{
        isAuthenticated: isAuthenticated() && dbState.state === "connected",
      }}
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
